/* ===================== */
/* Spreadsheet Import */
/* Reads .xlsx or .csv files into transactions. Fixes of the old importer:
   - headers are matched case-insensitively (the app's own CSV export
     uses "Date", "Amount", … and now re-imports cleanly)
   - an explicit Type column is respected instead of guessing from the sign
   - Excel date cells arrive as dates, not serial numbers like 46275
   - German formats work: "1.234,56" and "12.09.2026"
   - invalid rows are skipped and counted instead of failing the whole file
*/
/* ===================== */

import { isDateKey, toDateKey, todayKey } from "./format";
import { EXPENSES, INCOME } from "./finance";
import type { NewTransaction } from "./types";

export const MAX_IMPORT_ROWS = 1000;
export const ACCEPTED_FILES = ".xlsx,.csv";

type Cell = string | number | boolean | Date | null | undefined;

export type ImportResult = {
  rows: NewTransaction[];
  skipped: number;
};

const HEADER_ALIASES: Record<keyof NewTransaction, string[]> = {
  date: ["date", "transactiondate", "day", "datum"],
  type: ["type", "kind", "direction", "typ"],
  description: ["description", "name", "product", "title", "details", "beschreibung"],
  amount: ["amount", "price", "value", "sum", "betrag"],
  category: ["category", "kategorie"],
  status: ["status"],
};

const normalizeHeader = (value: Cell) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

/* ===================== */
/* Cell Parsers */
/* ===================== */

export function parseAmount(value: Cell): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;

  let text = value.replace(/[^\d.,-]/g, "");
  if (!text) return null;

  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");

  if (lastComma > lastDot) {
    // "1.234,56" or "12,5" → comma is the decimal separator
    text = text.replace(/\./g, "").replace(",", ".");
  } else {
    // "1,234.56" → commas are thousands separators
    text = text.replace(/,/g, "");
  }

  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function excelSerialToKey(serial: number) {
  // Excel day 0 is 1899-12-30; read the result in UTC to avoid zone shifts.
  const date = new Date(Date.UTC(1899, 11, 30) + Math.round(serial) * 86_400_000);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate(),
  ).padStart(2, "0")}`;
}

export function parseDate(value: Cell): string | null {
  if (value === null || value === undefined || value === "") return todayKey();

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : toDateKey(value);
  }

  if (typeof value === "number") {
    return value > 20_000 && value < 80_000 ? excelSerialToKey(value) : null;
  }

  const text = String(value).trim();

  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const key = `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
    return isDateKey(key) ? key : null;
  }

  // 12.09.2026 (German) or 12/09/2026 — day first, like the app's date picker.
  // 09/25/2026 is read month-first because 25 cannot be a month.
  const parts = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (parts) {
    let [day, month] = [Number(parts[1]), Number(parts[2])];
    if (month > 12 && day <= 12) [day, month] = [month, day];
    const key = `${parts[3]}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return isDateKey(key) ? key : null;
  }

  return null;
}

function parseType(value: Cell, amount: number) {
  const text = String(value ?? "").toLowerCase();
  if (/income|revenue|credit|einnahme/.test(text)) return INCOME;
  if (/expense|debit|spend|ausgabe/.test(text)) return EXPENSES;
  return amount < 0 ? EXPENSES : INCOME;
}

function parseStatus(value: Cell) {
  return /pending|open|offen/i.test(String(value ?? "")) ? "Pending" : "Completed";
}

/* ===================== */
/* Rows → Transactions */
/* ===================== */

export function rowsToTransactions(table: Cell[][]): ImportResult {
  const [header = [], ...body] = table.filter((row) => row.some((cell) => cell !== null && cell !== ""));
  const headers = header.map(normalizeHeader);

  const column = (field: keyof NewTransaction) =>
    headers.findIndex((name) => HEADER_ALIASES[field].includes(name));

  const index = {
    date: column("date"),
    type: column("type"),
    description: column("description"),
    amount: column("amount"),
    category: column("category"),
    status: column("status"),
  };

  if (index.amount === -1) {
    throw new Error('No "Amount" column found. Expected columns: Date, Type, Description, Amount, Category, Status.');
  }

  const cell = (row: Cell[], position: number) => (position === -1 ? undefined : row[position]);
  const rows: NewTransaction[] = [];
  let skipped = 0;

  for (const row of body.slice(0, MAX_IMPORT_ROWS)) {
    const amount = parseAmount(cell(row, index.amount) ?? null);
    const date = parseDate(cell(row, index.date));

    if (amount === null || amount === 0 || date === null) {
      skipped += 1;
      continue;
    }

    rows.push({
      date,
      type: parseType(cell(row, index.type), amount),
      description: String(cell(row, index.description) ?? "").trim() || "Imported transaction",
      amount: Math.abs(amount),
      category: String(cell(row, index.category) ?? "").trim() || "General",
      status: parseStatus(cell(row, index.status)),
    });
  }

  skipped += Math.max(0, body.length - MAX_IMPORT_ROWS);
  return { rows, skipped };
}

/** Minimal RFC 4180 parser; detects "," or ";" (German Excel) delimiters. */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, "");
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < clean.length; i += 1) {
    const char = clean[i];

    if (quoted) {
      if (char === '"' && clean[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && clean[i + 1] === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

export async function readTransactionsFile(file: File): Promise<ImportResult> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".csv")) {
    return rowsToTransactions(parseCsv(await file.text()));
  }

  if (name.endsWith(".xlsx")) {
    const { readSheet } = await import("read-excel-file/browser");
    return rowsToTransactions((await readSheet(file)) as Cell[][]);
  }

  throw new Error("Please choose an .xlsx or .csv file.");
}

/** Same columns the importer understands, so exports round-trip. */
export function toCsv(items: NewTransaction[]) {
  const headers = ["Date", "Type", "Description", "Amount", "Category", "Status"];
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

  return [
    headers.join(","),
    ...items.map((item) =>
      [item.date, item.type, item.description, item.amount, item.category, item.status].map(escape).join(","),
    ),
  ].join("\n");
}

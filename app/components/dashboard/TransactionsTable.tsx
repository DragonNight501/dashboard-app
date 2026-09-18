"use client";

/* ===================== */
/* Transactions */
/* Filter, sort, paginate, add, edit, delete, import and export.
*/
/* ===================== */

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import toast from "react-hot-toast";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import ConfirmDialog from "../ui/ConfirmDialog";
import TransactionDialog from "./TransactionDialog";
import { addTransactions, deleteTransaction, updateTransaction } from "../../lib/data";
import { categories, INCOME } from "../../lib/finance";
import { formatDay, formatMoney, todayKey } from "../../lib/format";
import { ACCEPTED_FILES, readTransactionsFile, toCsv } from "../../lib/import";
import type { NewTransaction, Transaction } from "../../lib/types";

type SortKey = "date" | "description" | "amount";
type SortDirection = "asc" | "desc";

const PAGE_SIZE = 10;

type Props = {
  data: Transaction[];
  loading: boolean;
  onChange: () => Promise<void>;
};

type SortButtonProps = {
  label: string;
  column: SortKey;
  sortKey: SortKey;
  direction: SortDirection;
  onSort: (column: SortKey) => void;
  align?: "left" | "right";
};

function SortButton({ label, column, sortKey, direction, onSort, align = "left" }: SortButtonProps) {
  const active = sortKey === column;
  const Icon = direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className={`inline-flex items-center gap-1 hover:text-fg ${align === "right" ? "flex-row-reverse" : ""} ${
        active ? "text-fg" : ""
      }`}
    >
      {label}
      {active ? <Icon className="h-3 w-3" /> : null}
    </button>
  );
}

/** Page numbers with gaps, e.g. 1 … 4 5 6 … 12 */
function pageList(current: number, total: number): (number | "gap")[] {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);

  return sorted.flatMap((page, index) =>
    index > 0 && page - sorted[index - 1] > 1 ? (["gap", page] as const) : [page],
  );
}

export default function TransactionsTable({ data, loading, onChange }: Props) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  /* ===================== */
  /* Derived rows */
  /* ===================== */

  const text = search.trim().toLowerCase();
  const filtered = data.filter(
    (item) =>
      (!text || `${item.description} ${item.category}`.toLowerCase().includes(text)) &&
      (typeFilter === "All" || item.type === typeFilter) &&
      (statusFilter === "All" || item.status === statusFilter),
  );

  const sorted = [...filtered].sort((a, b) => {
    const direction = sortDirection === "asc" ? 1 : -1;
    if (sortKey === "amount") return (Number(a.amount) - Number(b.amount)) * direction;
    if (sortKey === "date") return a.date.localeCompare(b.date) * direction || (a.id - b.id) * direction;
    return a.description.localeCompare(b.description) * direction;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages); // derived, so no effect is needed
  const start = (currentPage - 1) * PAGE_SIZE;
  const rows = sorted.slice(start, start + PAGE_SIZE);
  const knownCategories = categories(data);

  function resetPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection(key === "description" ? "asc" : "desc");
    }
  }

  /* ===================== */
  /* Actions */
  /* ===================== */

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(item: Transaction) {
    setEditing(item);
    setDialogOpen(true);
  }

  async function handleSubmit(values: NewTransaction) {
    const { error } = editing ? await updateTransaction(editing.id, values) : await addTransactions([values]);

    if (error === "not_authenticated") {
      toast.error("Your session expired — please log in again");
      return false;
    }
    if (error) {
      toast.error(editing ? "Failed to update transaction" : "Failed to add transaction");
      return false;
    }

    toast.success(editing ? "Transaction updated" : "Transaction added");
    await onChange();
    return true;
  }

  async function handleDelete() {
    if (!pendingDelete) return;

    setBusy(true);
    const { error } = await deleteTransaction(pendingDelete.id);
    setBusy(false);

    if (error) return toast.error("Failed to delete transaction");

    toast.success("Transaction deleted");
    setPendingDelete(null);
    await onChange();
  }

  function handleExport() {
    if (sorted.length === 0) return toast.error("Nothing to export");

    const blob = new Blob([toCsv(sorted)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transactions-${todayKey()}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${sorted.length} transactions`);
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow choosing the same file again
    if (!file) return;

    const loadingToast = toast.loading("Reading file…");

    try {
      const { rows, skipped } = await readTransactionsFile(file);

      if (rows.length === 0) {
        toast.error(skipped ? `No valid rows found (${skipped} skipped). Check the Date and Amount columns.` : "The file is empty", { id: loadingToast });
        return;
      }

      const { error } = await addTransactions(rows);
      if (error) {
        toast.error(error === "not_authenticated" ? "Your session expired — please log in again" : "Import failed", {
          id: loadingToast,
        });
        return;
      }

      const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
      toast.success(`Imported ${plural(rows.length, "transaction")}${skipped ? ` · ${plural(skipped, "row")} skipped` : ""}`, {
        id: loadingToast,
      });
      await onChange();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not read this file", { id: loadingToast });
    }
  }

  /* ===================== */
  /* UI */
  /* ===================== */

  const ariaSort = (column: SortKey) =>
    sortKey === column ? (sortDirection === "asc" ? "ascending" : "descending") : undefined;

  return (
    <section className="card rounded-2xl" aria-labelledby="transactions-title">
      <div className="flex flex-wrap items-end justify-between gap-4 px-5 pt-5">
        <div>
          <h3 id="transactions-title" className="font-semibold tracking-tight">
            Transactions
          </h3>
          <p className="text-sm text-muted">
            {loading
              ? "Loading…"
              : sorted.length === 0
                ? "No results"
                : `${start + 1}–${Math.min(start + PAGE_SIZE, sorted.length)} of ${sorted.length}`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <input ref={fileInput} type="file" accept={ACCEPTED_FILES} onChange={handleImport} hidden />
          <button type="button" className="btn btn-secondary" onClick={() => fileInput.current?.click()}>
            <Upload className="h-4 w-4" /> Import
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button type="button" className="btn btn-primary" onClick={openNew}>
            <Plus className="h-4 w-4" /> Add transaction
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 px-5 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search transactions</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-faint" />
          <input
            type="search"
            className="field pl-9"
            placeholder="Search description or category"
            value={search}
            onChange={(event) => resetPage(setSearch)(event.target.value)}
          />
        </label>
        <label className="sr-only" htmlFor="type-filter">
          Type
        </label>
        <select
          id="type-filter"
          className="field sm:w-40"
          value={typeFilter}
          onChange={(event) => resetPage(setTypeFilter)(event.target.value)}
        >
          <option value="All">All types</option>
          <option value="Income">Income</option>
          <option value="Expenses">Expenses</option>
        </select>
        <label className="sr-only" htmlFor="status-filter">
          Status
        </label>
        <select
          id="status-filter"
          className="field sm:w-40"
          value={statusFilter}
          onChange={(event) => resetPage(setStatusFilter)(event.target.value)}
        >
          <option value="All">All statuses</option>
          <option value="Completed">Completed</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-y border-line bg-surface-2/50 text-left font-mono text-[11px] tracking-wider text-faint uppercase">
              <th scope="col" className="px-5 py-2.5 font-normal" aria-sort={ariaSort("date")}>
                <SortButton label="Date" column="date" sortKey={sortKey} direction={sortDirection} onSort={toggleSort} />
              </th>
              <th scope="col" className="px-3 py-2.5 font-normal" aria-sort={ariaSort("description")}>
                <SortButton label="Description" column="description" sortKey={sortKey} direction={sortDirection} onSort={toggleSort} />
              </th>
              <th scope="col" className="px-3 py-2.5 font-normal">Category</th>
              <th scope="col" className="px-3 py-2.5 font-normal">Status</th>
              <th scope="col" className="px-3 py-2.5 text-right font-normal" aria-sort={ariaSort("amount")}>
                <SortButton label="Amount" column="amount" align="right" sortKey={sortKey} direction={sortDirection} onSort={toggleSort} />
              </th>
              <th scope="col" className="px-5 py-2.5 text-right font-normal">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading
              ? Array.from({ length: 5 }, (_, index) => (
                  <tr key={index}>
                    <td colSpan={6} className="px-5 py-3">
                      <div className="h-5 animate-pulse rounded bg-surface-2" />
                    </td>
                  </tr>
                ))
              : rows.map((item) => {
                  const income = item.type === INCOME;
                  return (
                    <tr key={item.id} className="group transition hover:bg-surface-2/40">
                      <td className="px-5 py-3 font-mono text-xs whitespace-nowrap text-muted">{formatDay(item.date)}</td>
                      <td className="max-w-[18rem] truncate px-3 py-3 font-medium">{item.description}</td>
                      <td className="px-3 py-3">
                        <span className="badge bg-surface-2 text-muted">{item.category}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`badge ${item.status === "Pending" ? "bg-pending/10 text-pending" : "bg-income/10 text-income"}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                          {item.status}
                        </span>
                      </td>
                      <td className={`tabular px-3 py-3 text-right font-mono whitespace-nowrap ${income ? "text-income" : "text-fg"}`}>
                        {income ? "+" : "−"}
                        {formatMoney(Number(item.amount))}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1 opacity-70 transition group-hover:opacity-100">
                          <button
                            type="button"
                            className="icon-btn h-8 w-8"
                            onClick={() => openEdit(item)}
                            aria-label={`Edit ${item.description}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className="icon-btn h-8 w-8 hover:text-expense"
                            onClick={() => setPendingDelete(item)}
                            aria-label={`Delete ${item.description}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-faint">
                  {data.length === 0
                    ? "No transactions yet. Add one or import a spreadsheet."
                    : "No transactions match these filters."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <nav aria-label="Pagination" className="flex items-center justify-between gap-2 border-t border-line px-5 py-3">
          <button
            type="button"
            className="btn btn-ghost px-2"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Previous</span>
          </button>
          <div className="flex items-center gap-1">
            {pageList(currentPage, totalPages).map((item, index) =>
              item === "gap" ? (
                <span key={`gap-${index}`} className="px-1 text-faint">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPage(item)}
                  aria-current={item === currentPage ? "page" : undefined}
                  className={`h-8 min-w-8 rounded-lg px-2 font-mono text-xs transition ${
                    item === currentPage ? "bg-ink text-on-ink" : "text-muted hover:bg-surface-2"
                  }`}
                >
                  {item}
                </button>
              ),
            )}
          </div>
          <button
            type="button"
            className="btn btn-ghost px-2"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <span className="hidden sm:inline">Next</span> <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      ) : null}

      <TransactionDialog
        open={dialogOpen}
        initial={editing}
        knownCategories={knownCategories}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete transaction?"
        message={`"${pendingDelete?.description ?? ""}" (${formatMoney(Number(pendingDelete?.amount ?? 0))}) will be permanently removed.`}
        confirmLabel="Delete"
        busy={busy}
        onConfirm={handleDelete}
        onClose={() => setPendingDelete(null)}
      />
    </section>
  );
}

"use client";

/* ===================== */
/* Demo Mode */
/* Lets visitors try the full dashboard without an account. Everything is
   stored in this browser's localStorage — nothing reaches Supabase.
*/
/* ===================== */

import { useSyncExternalStore } from "react";
import type { Budget, NewTransaction, Transaction } from "./types";

const FLAG_KEY = "finance-demo";
const TRANSACTIONS_KEY = "finance-demo-transactions";
const BUDGETS_KEY = "finance-demo-budgets";
const DEMO_USER = "demo";

/* ===================== */
/* Mode Flag */
/* ===================== */

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function isDemoMode() {
  if (typeof window === "undefined") return false;

  try {
    return localStorage.getItem(FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** Re-renders when demo mode is switched on or off (also across tabs). */
export function useDemoMode() {
  return useSyncExternalStore(subscribe, isDemoMode, () => false);
}

export function startDemo() {
  localStorage.setItem(FLAG_KEY, "1");

  if (localStorage.getItem(TRANSACTIONS_KEY) === null) {
    writeSeed();
  }

  emit();
}

export function resetDemo() {
  writeSeed();
  emit();
}

export function exitDemo() {
  localStorage.removeItem(FLAG_KEY);
  localStorage.removeItem(TRANSACTIONS_KEY);
  localStorage.removeItem(BUDGETS_KEY);
  emit();
}

/* ===================== */
/* Sample Data */
/* Six months of realistic activity ending today, so every chart has data.
*/
/* ===================== */

function toDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type SeedRow = [day: number, type: "Income" | "Expenses", description: string, amount: number, category: string];

const monthlyRows: SeedRow[] = [
  [1, "Income", "Monthly salary", 3200, "Salary"],
  [2, "Expenses", "Public transport pass", 49, "Transport"],
  [3, "Expenses", "Apartment rent", 1150, "Housing"],
  [5, "Expenses", "Weekly groceries", 86.4, "Groceries"],
  [10, "Expenses", "Electricity and internet", 138.9, "Utilities"],
  [12, "Expenses", "Weekly groceries", 74.15, "Groceries"],
  [15, "Expenses", "Streaming subscription", 17.99, "Subscriptions"],
  [17, "Expenses", "Dinner with friends", 46.5, "Dining"],
  [19, "Expenses", "Weekly groceries", 92.3, "Groceries"],
  [24, "Expenses", "Lunch meeting", 38, "Dining"],
  [26, "Expenses", "Weekly groceries", 68.75, "Groceries"],
];

const occasionalRows: Record<number, SeedRow[]> = {
  1: [[21, "Income", "Freelance website project", 650, "Freelance"]],
  2: [[8, "Expenses", "Weekend train trip", 420, "Travel"]],
  3: [
    [14, "Income", "Freelance dashboard design", 900, "Freelance"],
    [22, "Expenses", "Pharmacy", 34.2, "Health"],
  ],
  4: [[18, "Expenses", "New headphones", 129, "Electronics"]],
  5: [[20, "Income", "Freelance landing page", 700, "Freelance"]],
};

function createSeed() {
  const today = new Date();
  const todayString = toDateString(today);
  const transactions: Transaction[] = [];

  // monthsAgo 5 → oldest month, 0 → current month
  for (let monthsAgo = 5; monthsAgo >= 0; monthsAgo -= 1) {
    const monthIndex = 5 - monthsAgo;
    const rows = [...monthlyRows, ...(occasionalRows[monthIndex] ?? [])];

    for (const [day, type, description, amount, category] of rows) {
      const date = toDateString(new Date(today.getFullYear(), today.getMonth() - monthsAgo, day));
      if (date > todayString) continue;

      transactions.push({
        id: transactions.length + 1,
        date,
        type,
        description,
        amount,
        category,
        // This month's utility bill is still open.
        status: monthsAgo === 0 && category === "Utilities" ? "Pending" : "Completed",
        user_id: DEMO_USER,
      });
    }
  }

  // The most recent freelance invoice has not been paid yet.
  const lastFreelance = [...transactions].reverse().find((item) => item.category === "Freelance");
  if (lastFreelance) lastFreelance.status = "Pending";

  // Monthly limits chosen to show every state early in any month:
  // Housing is over (rent lands on the 3rd), Transport is close, Groceries fills up.
  const budgets: Budget[] = [
    { id: "demo-budget-1", category: "Groceries", amount: 350 },
    { id: "demo-budget-2", category: "Transport", amount: 60 },
    { id: "demo-budget-3", category: "Housing", amount: 1100 },
  ];

  return { transactions, budgets };
}

function writeSeed() {
  const { transactions, budgets } = createSeed();
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
}

/* ===================== */
/* Local Store */
/* ===================== */

function read<T>(key: string): T[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const demoStore = {
  listTransactions() {
    return read<Transaction>(TRANSACTIONS_KEY).sort((a, b) => b.date.localeCompare(a.date));
  },

  addTransactions(rows: NewTransaction[]) {
    const current = read<Transaction>(TRANSACTIONS_KEY);
    let nextId = current.reduce((max, item) => Math.max(max, item.id), 0);

    const created = rows.map((row) => ({ ...row, id: (nextId += 1), user_id: DEMO_USER }));
    write(TRANSACTIONS_KEY, [...current, ...created]);
  },

  updateTransaction(id: number, fields: Partial<Transaction>) {
    write(
      TRANSACTIONS_KEY,
      read<Transaction>(TRANSACTIONS_KEY).map((item) => (item.id === id ? { ...item, ...fields, id } : item)),
    );
  },

  deleteTransaction(id: number) {
    write(
      TRANSACTIONS_KEY,
      read<Transaction>(TRANSACTIONS_KEY).filter((item) => item.id !== id),
    );
  },

  listBudgets() {
    return read<Budget>(BUDGETS_KEY);
  },

  addBudget(category: string, amount: number) {
    write(BUDGETS_KEY, [...read<Budget>(BUDGETS_KEY), { id: `demo-budget-${Date.now()}`, category, amount }]);
  },

  deleteBudget(id: string) {
    write(
      BUDGETS_KEY,
      read<Budget>(BUDGETS_KEY).filter((item) => item.id !== id),
    );
  },
};

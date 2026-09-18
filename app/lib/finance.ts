/* ===================== */
/* Finance Calculations */
/* Pure functions — every number on the dashboard comes from here.
*/
/* ===================== */

import { monthKey, shiftMonth, todayKey } from "./format";
import type { Budget, Transaction } from "./types";

export const INCOME = "Income";
export const EXPENSES = "Expenses";

const amountOf = (item: Transaction) => Number(item.amount) || 0;
const isIncome = (item: Transaction) => item.type === INCOME;
const isExpense = (item: Transaction) => item.type === EXPENSES;

function sum(items: Transaction[]) {
  return items.reduce((total, item) => total + amountOf(item), 0);
}

export const currentMonth = () => monthKey(todayKey());

export function totals(items: Transaction[]) {
  const income = sum(items.filter(isIncome));
  const expenses = sum(items.filter(isExpense));
  return { income, expenses, net: income - expenses };
}

export function inMonth(items: Transaction[], month: string) {
  return items.filter((item) => monthKey(item.date) === month);
}

/** Relative change, or null when there is nothing to compare against. */
export function change(current: number, previous: number) {
  return previous === 0 ? null : (current - previous) / previous;
}

export function overview(items: Transaction[]) {
  const month = currentMonth();
  const thisMonth = totals(inMonth(items, month));
  const lastMonth = totals(inMonth(items, shiftMonth(month, -1)));
  const allTime = totals(items);

  const pending = items.filter((item) => item.status === "Pending");

  return {
    month,
    allTime,
    thisMonth,
    lastMonth,
    incomeChange: change(thisMonth.income, lastMonth.income),
    expensesChange: change(thisMonth.expenses, lastMonth.expenses),
    savingsRate: thisMonth.income > 0 ? thisMonth.net / thisMonth.income : null,
    pendingCount: pending.length,
    pendingAmount: sum(pending),
  };
}

/** Income, expenses and net for the last `count` months, oldest first. */
export function monthlySeries(items: Transaction[], count = 6) {
  const month = currentMonth();

  return Array.from({ length: count }, (_, index) => {
    const key = shiftMonth(month, index - (count - 1));
    const { income, expenses, net } = totals(inMonth(items, key));
    return { month: key, income, expenses, net };
  });
}

/** Expense totals per category, largest first; the tail is grouped as "Other". */
export function spendingByCategory(items: Transaction[], limit = 5) {
  const map = new Map<string, number>();

  for (const item of items.filter(isExpense)) {
    const category = item.category?.trim() || "General";
    map.set(category, (map.get(category) ?? 0) + amountOf(item));
  }

  const sorted = [...map.entries()]
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value);

  if (sorted.length <= limit) return sorted;

  const other = sorted.slice(limit - 1).reduce((total, row) => total + row.value, 0);
  return [...sorted.slice(0, limit - 1), { category: "Other", value: other }];
}

export function averageMonthlyExpenses(items: Transaction[], months = 6) {
  const series = monthlySeries(items, months).filter((row) => row.income > 0 || row.expenses > 0);
  if (series.length === 0) return 0;
  return series.reduce((total, row) => total + row.expenses, 0) / series.length;
}

export function categories(items: Transaction[]) {
  return [...new Set(items.map((item) => item.category?.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

/** Budgets are monthly: spending counts only this month's expenses. */
export function budgetProgress(budgets: Budget[], items: Transaction[]) {
  const monthExpenses = inMonth(items, currentMonth()).filter(isExpense);

  return budgets.map((budget) => {
    const limit = Number(budget.amount) || 0;
    const spent = sum(
      monthExpenses.filter((item) => item.category?.trim().toLowerCase() === budget.category.trim().toLowerCase()),
    );

    return {
      ...budget,
      amount: limit,
      spent,
      remaining: limit - spent,
      ratio: limit > 0 ? spent / limit : 0,
    };
  });
}

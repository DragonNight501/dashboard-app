"use client";

/* ===================== */
/* Budgets */
/* Monthly limits per category. Spending now counts only the current
   month — previously it summed every expense ever recorded, so budgets
   eventually always showed "exceeded".
*/
/* ===================== */

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2 } from "lucide-react";
import ConfirmDialog from "../ui/ConfirmDialog";
import { addBudget, deleteBudget, listBudgets } from "../../lib/data";
import { budgetProgress, categories, currentMonth } from "../../lib/finance";
import { formatMoney, formatMonthLong } from "../../lib/format";
import type { Budget, Transaction } from "../../lib/types";

export default function BudgetManager({ transactions }: { transactions: Transaction[] }) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Budget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await listBudgets();
    if (error) toast.error("Failed to load budgets");
    setBudgets(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;

    async function initialLoad() {
      const { data, error } = await listBudgets();
      if (!active) return;
      if (error) toast.error("Failed to load budgets");
      setBudgets(data);
      setLoading(false);
    }

    void initialLoad();
    return () => {
      active = false;
    };
  }, []);

  const progress = budgetProgress(budgets, transactions).sort((a, b) => b.ratio - a.ratio);
  const knownCategories = categories(transactions);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();

    const name = category.trim();
    const limit = Number(amount);

    if (!name) return toast.error("Choose or type a category");
    if (!Number.isFinite(limit) || limit <= 0) return toast.error("Enter a budget greater than 0");
    if (budgets.some((budget) => budget.category.trim().toLowerCase() === name.toLowerCase())) {
      return toast.error(`A budget for "${name}" already exists`);
    }

    setSaving(true);
    const { error } = await addBudget(name, Math.round(limit * 100) / 100);
    setSaving(false);

    if (error === "not_authenticated") return toast.error("Your session expired — please log in again");
    if (error) return toast.error("Failed to add budget");

    toast.success("Budget added");
    setCategory("");
    setAmount("");
    await load();
  }

  async function handleDelete() {
    if (!pendingDelete) return;

    setDeleting(true);
    const { error } = await deleteBudget(pendingDelete.id);
    setDeleting(false);

    if (error) return toast.error("Failed to delete budget");

    toast.success("Budget deleted");
    setPendingDelete(null);
    await load();
  }

  return (
    <section className="card rounded-2xl p-5" aria-labelledby="budgets-title">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 id="budgets-title" className="font-semibold tracking-tight">
            Monthly budgets
          </h3>
          <p className="text-sm text-muted">Spending in {formatMonthLong(currentMonth())}</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="mt-4 grid grid-cols-[1fr_auto] gap-2">
        <label className="sr-only" htmlFor="budget-category">
          Category
        </label>
        <input
          id="budget-category"
          className="field col-span-2"
          list="budget-categories"
          placeholder="Category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          maxLength={40}
        />
        <datalist id="budget-categories">
          {knownCategories.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>

        <label className="sr-only" htmlFor="budget-amount">
          Monthly limit
        </label>
        <input
          id="budget-amount"
          className="field tabular"
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          placeholder="Monthly limit (USD)"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={saving}>
          <Plus className="h-4 w-4" /> {saving ? "Adding…" : "Add"}
        </button>
      </form>

      <ul className="mt-5 space-y-4">
        {loading ? (
          <li className="h-14 animate-pulse rounded-xl bg-surface-2" />
        ) : progress.length === 0 ? (
          <li className="rounded-xl border border-dashed border-line-strong px-4 py-6 text-center text-sm text-faint">
            No budgets yet. Set a monthly limit for a category above.
          </li>
        ) : (
          progress.map((budget) => {
            const exceeded = budget.spent > budget.amount;
            const warning = !exceeded && budget.ratio >= 0.8;
            const bar = exceeded ? "bg-expense" : warning ? "bg-pending" : "bg-income";

            return (
              <li key={budget.id}>
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium">{budget.category}</p>
                  <div className="flex items-center gap-1">
                    <p className="tabular font-mono text-xs text-muted">
                      {formatMoney(budget.spent)} / {formatMoney(budget.amount)}
                    </p>
                    <button
                      type="button"
                      className="icon-btn h-7 w-7 hover:text-expense"
                      onClick={() => setPendingDelete(budget)}
                      aria-label={`Delete ${budget.category} budget`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div
                  className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2"
                  role="progressbar"
                  aria-label={`${budget.category} budget used`}
                  aria-valuenow={Math.round(Math.min(budget.ratio, 1) * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className={`h-full rounded-full ${bar} transition-[width] duration-500`} style={{ width: `${Math.min(budget.ratio, 1) * 100}%` }} />
                </div>
                <p className={`mt-1 text-xs ${exceeded ? "text-expense" : "text-faint"}`}>
                  {exceeded
                    ? `${formatMoney(-budget.remaining)} over budget`
                    : `${formatMoney(budget.remaining)} left`}
                </p>
              </li>
            );
          })
        )}
      </ul>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete budget?"
        message={`The monthly limit for "${pendingDelete?.category ?? ""}" will be removed. Transactions are not affected.`}
        confirmLabel="Delete budget"
        busy={deleting}
        onConfirm={handleDelete}
        onClose={() => setPendingDelete(null)}
      />
    </section>
  );
}

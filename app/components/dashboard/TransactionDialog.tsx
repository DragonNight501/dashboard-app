"use client";

/* ===================== */
/* Transaction Form */
/* Add and edit share one form. Dates use the native date input, whose value
   is already "YYYY-MM-DD" in the user's calendar — no UTC conversion.
*/
/* ===================== */

import { useState } from "react";
import type { FormEvent } from "react";
import Dialog from "../ui/Dialog";
import { EXPENSES, INCOME } from "../../lib/finance";
import { isDateKey, todayKey } from "../../lib/format";
import type { NewTransaction, Transaction } from "../../lib/types";

type Props = {
  open: boolean;
  initial: Transaction | null;
  knownCategories: string[];
  onClose: () => void;
  onSubmit: (values: NewTransaction) => Promise<boolean>;
};

const empty = (): NewTransaction => ({
  date: todayKey(),
  type: EXPENSES,
  description: "",
  amount: 0,
  category: "",
  status: "Completed",
});

function Segmented({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: string;
  options: { value: string; label: string; tone: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg border border-line bg-surface-2/60 p-1">
      {options.map((option) => (
        <label
          key={option.value}
          className={`flex cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${
            value === option.value ? "bg-surface font-medium text-fg shadow-sm" : "text-muted hover:text-fg"
          }`}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          <span className={`h-1.5 w-1.5 rounded-full ${option.tone}`} aria-hidden="true" />
          {option.label}
        </label>
      ))}
    </div>
  );
}

function TransactionForm({ initial, knownCategories, onClose, onSubmit }: Omit<Props, "open">) {
  const [values, setValues] = useState<NewTransaction>(() =>
    initial
      ? {
          date: initial.date,
          type: initial.type,
          description: initial.description,
          amount: Number(initial.amount),
          category: initial.category,
          status: initial.status,
        }
      : empty(),
  );
  const [amountText, setAmountText] = useState(initial ? String(initial.amount) : "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof NewTransaction>(key: K, value: NewTransaction[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const amount = Number(amountText);
    const description = values.description.trim();
    const category = values.category.trim();

    if (!isDateKey(values.date)) return setError("Choose a valid date.");
    if (!description) return setError("Add a short description.");
    if (!Number.isFinite(amount) || amount <= 0) return setError("Amount must be greater than 0.");
    if (!category) return setError("Choose or type a category.");

    setError("");
    setSaving(true);
    const saved = await onSubmit({
      ...values,
      description,
      category,
      amount: Math.round(amount * 100) / 100,
    });
    setSaving(false);

    if (saved) onClose();
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <span className="label">Type</span>
          <Segmented
            name="type"
            value={values.type}
            onChange={(value) => set("type", value)}
            options={[
              { value: EXPENSES, label: "Expense", tone: "bg-expense" },
              { value: INCOME, label: "Income", tone: "bg-income" },
            ]}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="label" htmlFor="tx-description">
            Description
          </label>
          <input
            id="tx-description"
            className="field"
            value={values.description}
            onChange={(event) => set("description", event.target.value)}
            maxLength={120}
            placeholder="e.g. Weekly groceries"
            autoFocus
          />
        </div>

        <div>
          <label className="label" htmlFor="tx-amount">
            Amount (USD)
          </label>
          <input
            id="tx-amount"
            className="field tabular"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            value={amountText}
            onChange={(event) => setAmountText(event.target.value)}
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="label" htmlFor="tx-date">
            Date
          </label>
          <input
            id="tx-date"
            className="field"
            type="date"
            value={values.date}
            onChange={(event) => set("date", event.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="tx-category">
            Category
          </label>
          <input
            id="tx-category"
            className="field"
            list="tx-categories"
            value={values.category}
            onChange={(event) => set("category", event.target.value)}
            maxLength={40}
            placeholder="e.g. Groceries"
          />
          <datalist id="tx-categories">
            {knownCategories.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>

        <div>
          <span className="label">Status</span>
          <Segmented
            name="status"
            value={values.status}
            onChange={(value) => set("status", value)}
            options={[
              { value: "Completed", label: "Completed", tone: "bg-income" },
              { value: "Pending", label: "Pending", tone: "bg-pending" },
            ]}
          />
        </div>
      </div>

      {error ? (
        <p role="alert" className="mx-5 -mt-1 mb-3 rounded-lg bg-expense/10 px-3 py-2 text-sm text-expense">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : initial ? "Save changes" : "Add transaction"}
        </button>
      </div>
    </form>
  );
}

export default function TransactionDialog(props: Props) {
  return (
    <Dialog
      open={props.open}
      title={props.initial ? "Edit transaction" : "New transaction"}
      description={props.initial ? undefined : "Record income or an expense."}
      onClose={props.onClose}
    >
      {/* Keyed so the form resets whenever a different transaction is opened. */}
      <TransactionForm
        key={props.initial?.id ?? "new"}
        initial={props.initial}
        knownCategories={props.knownCategories}
        onClose={props.onClose}
        onSubmit={props.onSubmit}
      />
    </Dialog>
  );
}

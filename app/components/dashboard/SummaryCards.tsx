"use client";

/* ===================== */
/* Summary Cards */
/* This month at a glance, compared with last month.
*/
/* ===================== */

import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Clock, PiggyBank, Scale, TrendingDown, TrendingUp } from "lucide-react";
import { formatMoney, formatMonthLong, formatPercent } from "../../lib/format";
import { averageMonthlyExpenses, overview, spendingByCategory, inMonth } from "../../lib/finance";
import type { Transaction } from "../../lib/types";

type Props = {
  transactions: Transaction[];
  loading: boolean;
};

function Delta({ value, goodWhenUp }: { value: number | null; goodWhenUp: boolean }) {
  if (value === null) return <span className="text-faint">no data last month</span>;

  const up = value >= 0;
  const good = up === goodWhenUp;
  const Icon = up ? ArrowUpRight : ArrowDownRight;

  return (
    <span className={`inline-flex items-center gap-0.5 ${good ? "text-income" : "text-expense"}`}>
      <Icon className="h-3.5 w-3.5" />
      {formatPercent(Math.abs(value))} vs last month
    </span>
  );
}

function Stat({
  label,
  value,
  icon,
  tone,
  footer,
  loading,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tone: string;
  footer: ReactNode;
  loading: boolean;
}) {
  return (
    <div className="card rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{label}</p>
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${tone}`}>{icon}</span>
      </div>
      <p className="tabular mt-3 font-mono text-2xl font-medium tracking-tight">
        {loading ? <span className="inline-block h-7 w-32 animate-pulse rounded bg-surface-2" /> : value}
      </p>
      <p className="mt-2 text-xs">{loading ? " " : footer}</p>
    </div>
  );
}

export default function SummaryCards({ transactions, loading }: Props) {
  const data = overview(transactions);
  const topCategory = spendingByCategory(inMonth(transactions, data.month), 99)[0];
  const average = averageMonthlyExpenses(transactions);

  return (
    <section aria-labelledby="summary-title">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">This month</p>
          <h2 id="summary-title" className="mt-2 text-xl font-semibold tracking-tight">
            {formatMonthLong(data.month)}
          </h2>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Net balance"
          value={formatMoney(data.allTime.net)}
          icon={<Scale className="h-4 w-4" />}
          tone="bg-accent/10 text-accent"
          footer={<span className="text-faint">All income minus all expenses</span>}
          loading={loading}
        />
        <Stat
          label="Income"
          value={formatMoney(data.thisMonth.income)}
          icon={<TrendingUp className="h-4 w-4" />}
          tone="bg-income/10 text-income"
          footer={<Delta value={data.incomeChange} goodWhenUp />}
          loading={loading}
        />
        <Stat
          label="Expenses"
          value={formatMoney(data.thisMonth.expenses)}
          icon={<TrendingDown className="h-4 w-4" />}
          tone="bg-expense/10 text-expense"
          footer={<Delta value={data.expensesChange} goodWhenUp={false} />}
          loading={loading}
        />
        <Stat
          label="Savings rate"
          value={data.savingsRate === null ? "—" : formatPercent(data.savingsRate)}
          icon={<PiggyBank className="h-4 w-4" />}
          tone="bg-cyan/10 text-cyan"
          footer={<span className="text-faint">Share of this month&apos;s income kept</span>}
          loading={loading}
        />
      </div>

      <dl className="card mt-4 grid divide-y divide-line rounded-2xl sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="px-5 py-4">
          <dt className="text-xs text-faint">Top spending this month</dt>
          <dd className="mt-1 truncate text-sm font-medium">
            {loading ? "…" : topCategory ? `${topCategory.category} · ${formatMoney(topCategory.value)}` : "No expenses yet"}
          </dd>
        </div>
        <div className="px-5 py-4">
          <dt className="flex items-center gap-1.5 text-xs text-faint">
            <Clock className="h-3 w-3" /> Pending
          </dt>
          <dd className="mt-1 text-sm font-medium">
            {loading ? "…" : `${data.pendingCount} · ${formatMoney(data.pendingAmount)}`}
          </dd>
        </div>
        <div className="px-5 py-4">
          <dt className="text-xs text-faint">Average monthly expenses (6 mo)</dt>
          <dd className="tabular mt-1 text-sm font-medium">{loading ? "…" : formatMoney(average)}</dd>
        </div>
      </dl>
    </section>
  );
}

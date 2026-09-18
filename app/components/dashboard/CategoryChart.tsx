"use client";

/* ===================== */
/* Spending by Category */
/* ===================== */

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import ChartTooltip from "./ChartTooltip";
import { formatMoney, formatPercent } from "../../lib/format";
import { spendingByCategory } from "../../lib/finance";
import { useReducedMotion } from "../../lib/useReducedMotion";
import type { Transaction } from "../../lib/types";

const palette = ["var(--accent)", "var(--cyan)", "var(--expense)", "var(--pending)", "var(--faint)"];

export default function CategoryChart({ transactions }: { transactions: Transaction[] }) {
  const animate = !useReducedMotion();
  const data = spendingByCategory(transactions, 5);
  const total = data.reduce((sum, row) => sum + row.value, 0);

  return (
    <section className="card flex flex-col rounded-2xl p-5" aria-labelledby="category-title">
      <h3 id="category-title" className="font-semibold tracking-tight">
        Spending by category
      </h3>
      <p className="text-sm text-muted">All time</p>

      {total > 0 ? (
        <>
          <div className="relative mt-2 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  isAnimationActive={animate}
                  data={data}
                  dataKey="value"
                  nameKey="category"
                  innerRadius="68%"
                  outerRadius="100%"
                  paddingAngle={2}
                  stroke="none"
                >
                  {data.map((row, index) => (
                    <Cell key={row.category} fill={palette[index % palette.length]} />
                  ))}
                </Pie>
                <Tooltip content={(props) => <ChartTooltip {...props} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="text-[11px] text-faint">Total spent</p>
                <p className="tabular font-mono text-sm font-medium">{formatMoney(total)}</p>
              </div>
            </div>
          </div>

          <ul className="mt-4 space-y-2 text-sm">
            {data.map((row, index) => (
              <li key={row.category} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: palette[index % palette.length] }} />
                <span className="truncate">{row.category}</span>
                <span className="ml-auto font-mono text-xs text-faint">{formatPercent(row.value / total)}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-4 grid flex-1 place-items-center rounded-xl border border-dashed border-line-strong py-10 text-sm text-faint">
          No expenses yet
        </p>
      )}
    </section>
  );
}

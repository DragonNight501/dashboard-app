"use client";

/* ===================== */
/* Cash Flow */
/* Income and expenses per month as separate bars, with the net result as
   a line. (The old trend chart added income and expenses together.)
*/
/* ===================== */

import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartTooltip from "./ChartTooltip";
import { formatCompactMoney, formatMonthLong, formatMonthShort } from "../../lib/format";
import { monthlySeries } from "../../lib/finance";
import { useReducedMotion } from "../../lib/useReducedMotion";
import type { Transaction } from "../../lib/types";

const legend = [
  { label: "Income", color: "var(--income)" },
  { label: "Expenses", color: "var(--expense)" },
  { label: "Net", color: "var(--accent)" },
];

export default function CashFlowChart({ transactions }: { transactions: Transaction[] }) {
  const animate = !useReducedMotion();
  const data = monthlySeries(transactions, 6);
  const hasData = data.some((row) => row.income > 0 || row.expenses > 0);

  return (
    <section className="card rounded-2xl p-5" aria-labelledby="cashflow-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="cashflow-title" className="font-semibold tracking-tight">
            Cash flow
          </h3>
          <p className="text-sm text-muted">Last six months</p>
        </div>
        <ul className="flex flex-wrap gap-4 text-xs text-muted">
          {legend.map((item) => (
            <li key={item.label} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 h-72">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barGap={4}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={formatMonthShort} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatCompactMoney} axisLine={false} tickLine={false} width={56} />
              <Tooltip
                cursor={{ fill: "var(--surface-2)" }}
                content={(props) => <ChartTooltip {...props} formatLabel={formatMonthLong} />}
              />
              <Bar isAnimationActive={animate} dataKey="income" name="Income" fill="var(--income)" radius={[6, 6, 0, 0]} maxBarSize={28} />
              <Bar isAnimationActive={animate} dataKey="expenses" name="Expenses" fill="var(--expense)" radius={[6, 6, 0, 0]} maxBarSize={28} />
              <Line
                isAnimationActive={animate}
                dataKey="net"
                name="Net"
                type="monotone"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--accent)" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <p className="grid h-full place-items-center rounded-xl border border-dashed border-line-strong text-sm text-faint">
            Add transactions to see your cash flow
          </p>
        )}
      </div>
    </section>
  );
}

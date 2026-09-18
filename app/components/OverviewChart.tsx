"use client";

/* ===================== */
/* Imports */
/* ===================== */

import { useEffect, useMemo, useState } from "react";
import type { Transaction } from "../lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

/* ===================== */
/* Types */
/* ===================== */

type Props = {
  transactions: Transaction[];
};

/* ===================== */
/* Overview Chart */
/* Displays income vs expenses using a bar chart.
 */
/* ===================== */

export default function OverviewChart({ transactions }: Props) {
  const [isMounted, setIsMounted] = useState(false);

  /* ===================== */
  /* Client Mount Check */
  /* Prevents chart rendering issues during hydration.
   */
  /* ===================== */

  useEffect(() => {
    setIsMounted(true);
  }, []);

  /* ===================== */
  /* Chart Data */
  /* Calculates income and expenses totals from transactions.
   */
  /* ===================== */

  const chartData = useMemo(() => {
    const income = transactions
      .filter((transaction) => transaction.type === "Income")
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    const expenses = transactions
      .filter((transaction) => transaction.type === "Expenses")
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    return [
      { name: "Income", value: income, color: "#22c55e" },
      { name: "Expenses", value: expenses, color: "#ef4444" },
    ];
  }, [transactions]);

  const hasData = chartData.some((item) => item.value > 0);

  /* ===================== */
  /* UI Rendering */
  /* ===================== */

  return (
    <div className="chartContainer">
      <h3 className="mainTitle">Overview Chart</h3>

      {!isMounted ? (
        <div className="chartEmptyState">Loading chart...</div>
      ) : !hasData ? (
        <div className="chartEmptyState">No income or expenses available</div>
      ) : (
        <div className="chartBox">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

              <XAxis dataKey="name" tick={{ fontSize: 12 }} />

              <YAxis tick={{ fontSize: 12 }} />

              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                }}
              />
              <Bar dataKey="value" radius={[14, 14, 0, 0]} barSize={52}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

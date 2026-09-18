"use client";

/* ===================== */
/* Imports */
/* ===================== */

import { useEffect, useMemo, useState } from "react";
import type { Transaction } from "../lib/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

/* ===================== */
/* Types */
/* ===================== */

type Props = {
  transactions: Transaction[];
};

/* ===================== */
/* Monthly Line Chart */
/* Displays monthly aggregated transaction amounts over time.
 */
/* ===================== */

export default function MonthlyLineChart({ transactions }: Props) {
  const [isMounted, setIsMounted] = useState(false);

  /* ===================== */
  /* Client Mount Check */
  /* ===================== */

  useEffect(() => {
    setIsMounted(true);
  }, []);

  /* ===================== */
  /* Chart Data */
  /* Groups transactions by month and calculates totals.
   */
  /* ===================== */

  const chartData = useMemo(() => {
    const grouped = transactions.reduce<Record<string, number>>(
      (acc, transaction) => {
        const month = transaction.date.slice(0, 7); // YYYY-MM
        acc[month] = (acc[month] || 0) + Number(transaction.amount);
        return acc;
      },
      {},
    );

    return Object.entries(grouped)
      .map(([month, total]) => ({
        month,
        total,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  const hasData = chartData.length > 0;

  /* ===================== */
  /* UI Rendering */
  /* ===================== */

  return (
    <div className="chartContainer">
      <h3 className="mainTitle">Monthly Finance Trend</h3>

      {!isMounted ? (
        <div className="chartEmptyState">Loading chart...</div>
      ) : !hasData ? (
        <div className="chartEmptyState">No monthly data available</div>
      ) : (
        <div className="chartBox">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

              <XAxis dataKey="month" tick={{ fontSize: 12 }} />

              <YAxis tick={{ fontSize: 12 }} />

              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                }}
              />

              <Line
                type="monotone"
                dataKey="total"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

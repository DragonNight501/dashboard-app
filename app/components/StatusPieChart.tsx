"use client";

/* ===================== */
/* Imports */
/* ===================== */

import { useEffect, useMemo, useState } from "react";
import type { Transaction } from "../lib/types";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

/* ===================== */
/* Types */
/* ===================== */

type Props = {
  transactions: Transaction[];
};

/* ===================== */
/* Status Pie Chart */
/* Visualizes transaction status distribution.
 */
/* ===================== */

export default function StatusPieChart({ transactions }: Props) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartData = useMemo(() => {
    const completed = transactions.filter(
      (transaction) => transaction.status === "Completed",
    ).length;

    const pending = transactions.filter(
      (transaction) => transaction.status === "Pending",
    ).length;

    return [
      { name: "Completed", value: completed, color: "#22c55e" },
      { name: "Pending", value: pending, color: "#facc15" },
    ].filter((item) => item.value > 0);
  }, [transactions]);

  const hasData = chartData.length > 0;

  return (
    <div className="chartContainer">
      <h3 className="mainTitle">Status Overview</h3>

      {!isMounted ? (
        <div className="chartEmptyState">Loading chart...</div>
      ) : !hasData ? (
        <div className="chartEmptyState">No status data available</div>
      ) : (
        <div className="chartBox">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={5}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>

              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                }}
              />

              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

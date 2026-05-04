"use client";

/* ===================== */
/* Imports */
/* ===================== */

import { useEffect, useMemo, useState } from "react";
import type { Transaction } from "../page";
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
/* Visualizes transaction status distribution (Completed vs Pending).
 */
/* ===================== */

export default function StatusPieChart({ transactions }: Props) {
  const [isMounted, setIsMounted] = useState(false);

  /* ===================== */
  /* Client Mount Check */
  /* ===================== */

  useEffect(() => {
    setIsMounted(true);
  }, []);

  /* ===================== */
  /* Chart Data */
  /* ===================== */

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

  /* ===================== */
  /* UI Rendering */
  /* ===================== */

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
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>

              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import type { Transaction } from "../page";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type Props = {
  transactions: Transaction[];
};

export default function StatusPieChart({ transactions }: Props) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const completed = transactions.filter(
    (transaction) => transaction.status === "Completed"
  ).length;

  const pending = transactions.filter(
    (transaction) => transaction.status === "Pending"
  ).length;

  const data = [
    { name: "Completed", value: completed, color: "#22c55e" },
    { name: "Pending", value: pending, color: "#facc15" },
  ].filter((item) => item.value > 0);

  return (
    <div className="chartContainer">
      <h3 className="mainTitle">Status Overview</h3>

      {!isMounted ? (
        <div className="chartEmptyState">Loading chart...</div>
      ) : data.length === 0 ? (
        <div className="chartEmptyState">No data available</div>
      ) : (
        <div className="chartBox">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
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
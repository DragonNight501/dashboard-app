"use client";

import { useEffect, useState } from "react";
import type { Transaction } from "../page";
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

type Props = {
  transactions: Transaction[];
};

export default function OverviewChart({ transactions }: Props) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const income = transactions
    .filter((transaction) => transaction.type === "Income")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const expenses = transactions
    .filter((transaction) => transaction.type === "Expenses")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const data = [
    { name: "Income", value: income, color: "#22c55e" },
    { name: "Expenses", value: expenses, color: "#ef4444" },
  ];

  return (
    <div className="chartContainer">
      <h3 className="mainTitle">Overview Chart</h3>

      {!isMounted ? (
        <div className="chartEmptyState">Loading chart...</div>
      ) : (
        <div className="chartBox">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
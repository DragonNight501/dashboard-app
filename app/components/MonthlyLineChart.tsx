"use client";

import { useEffect, useState } from "react";
import type { Transaction } from "../page";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Props = {
  transactions: Transaction[];
};

export default function MonthlyLineChart({ transactions }: Props) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const groupedData = transactions.reduce<Record<string, number>>(
    (acc, transaction) => {
      const month = transaction.date.slice(0, 7);
      acc[month] = (acc[month] || 0) + Number(transaction.amount);
      return acc;
    },
    {}
  );

  const chartData = Object.entries(groupedData)
    .map(([month, total]) => ({
      month,
      total,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return (
    <div className="chartContainer">
      <h3 className="mainTitle">Monthly Finance Trend</h3>

      {!isMounted ? (
        <div className="chartEmptyState">Loading chart...</div>
      ) : chartData.length === 0 ? (
        <div className="chartEmptyState">No data available</div>
      ) : (
        <div className="chartBox">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#3b82f6"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
"use client";

import { useMemo } from "react";
import type { Transaction } from "../lib/types";

type Props = {
  transactions: Transaction[];
  loading: boolean;
};

export default function Cards({ transactions, loading }: Props) {
  /* ===================== */
  /* Basic Calculations */
  /* ===================== */

  const income = transactions
    .filter((t) => t.type === "Income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenses = transactions
    .filter((t) => t.type === "Expenses")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = income - expenses;

  /* ===================== */
  /* Advanced Insights */
  /* ===================== */

  const insights = useMemo(() => {
    if (transactions.length === 0) return null;

    // Highest spending category
    const categoryMap: Record<string, number> = {};

    transactions
      .filter((t) => t.type === "Expenses")
      .forEach((t) => {
        categoryMap[t.category] =
          (categoryMap[t.category] || 0) + Number(t.amount);
      });

    const topCategory = Object.entries(categoryMap).sort(
      (a, b) => b[1] - a[1],
    )[0];

    // Latest transaction
    const latest = [...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )[0];

    // Monthly average
    const months = new Set(transactions.map((t) => t.date.slice(0, 7))).size;

    const avg = months ? expenses / months : 0;

    return {
      topCategory,
      latest,
      avg,
    };
  }, [transactions]);

  /* ===================== */
  /* UI */
  /* ===================== */

  return (
    <div className="cardContainer">
      <h3 className="mainTitle">Overview</h3>

      <div className="cardWrapper">
        <Card title="Income" value={income} loading={loading} color="green" />
        <Card title="Expenses" value={expenses} loading={loading} color="red" />
        <Card title="Balance" value={balance} loading={loading} color="blue" />
        <Card
          title="Transactions"
          value={transactions.length}
          loading={loading}
          color="purple"
          isCount
        />
      </div>

      {/* ===================== */}
      {/* Insights Section */}
      {/* ===================== */}

      {insights && (
        <div className="cardWrapper" style={{ marginTop: "1rem" }}>
          <div className="paymentCard lightBlue insightCard">
            <span className="title">Top Spending Category</span>
            <span className="amountValue">
              {insights.topCategory
                ? `${insights.topCategory[0]} ($${insights.topCategory[1].toFixed(
                    2,
                  )})`
                : "—"}
            </span>
          </div>

          <div className="paymentCard lightBlue insightCard">
            <span className="title">Latest Transaction</span>
            <span className="amountValue">
              {insights.latest
                ? `${insights.latest.description} ($${insights.latest.amount})`
                : "—"}
            </span>
          </div>

          <div className="paymentCard lightGreen insightCard">
            <span className="title">Monthly Avg Expenses</span>
            <span className="amountValue">${insights.avg.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== */
/* Reusable Card */
/* ===================== */

function Card({ title, value, loading, color, isCount }: any) {
  return (
    <div className={`paymentCard light${capitalize(color)}`}>
      <div className="cardHeader">
        <div className="amount">
          <span className="title">{title}</span>
          <span className="amountValue">
            {loading ? "..." : isCount ? value : `$${Number(value).toFixed(2)}`}
          </span>
        </div>
        <div className={`icon dark${capitalize(color)}`}>
          {title === "Transactions" ? "#" : "$"}
        </div>
      </div>
    </div>
  );
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

"use client";

/* ===================== */
/* Imports */
/* ===================== */

import type { Transaction } from "../page";

/* ===================== */
/* Types */
/* ===================== */

type Props = {
  transactions: Transaction[];
  loading: boolean;
};

type OverviewCard = {
  title: string;
  value: string | number;
  detail: string;
  icon: string;
  cardClass: string;
  iconClass: string;
  valueClass?: string;
};

/* ===================== */
/* Dashboard Overview Cards */
/* Calculates and displays the main financial summary metrics.
 */
/* ===================== */

export default function Cards({ transactions, loading }: Props) {
  /* ===================== */
  /* Financial Calculations */
  /* ===================== */

  const income = transactions
    .filter((transaction) => transaction.type === "Income")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const expenses = transactions
    .filter((transaction) => transaction.type === "Expenses")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const balance = income - expenses;

  /* ===================== */
  /* Card Configuration */
  /* Keeps the UI easier to update and avoids repeated JSX.
   */
  /* ===================== */

  const cards: OverviewCard[] = [
    {
      title: "Total Income",
      value: `$${income.toFixed(2)}`,
      detail: "All income transactions",
      icon: "$",
      cardClass: "lightGreen",
      iconClass: "darkGreen",
    },
    {
      title: "Total Expenses",
      value: `$${expenses.toFixed(2)}`,
      detail: "All expense transactions",
      icon: "$",
      cardClass: "lightRed",
      iconClass: "darkRed",
    },
    {
      title: "Balance",
      value: `$${balance.toFixed(2)}`,
      detail: "Current balance",
      icon: "≡",
      cardClass: "lightBlue",
      iconClass: "darkBlue",
      valueClass: balance >= 0 ? "positiveValue" : "negativeValue",
    },
    {
      title: "Transactions",
      value: transactions.length,
      detail: "Total records",
      icon: "#",
      cardClass: "lightPurple",
      iconClass: "darkPurple",
    },
  ];

  /* ===================== */
  /* UI Rendering */
  /* ===================== */

  return (
    <div className="cardContainer">
      <h3 className="mainTitle">Overview</h3>

      <div className="cardWrapper">
        {cards.map((card) => (
          <div key={card.title} className={`paymentCard ${card.cardClass}`}>
            <div className="cardHeader">
              <div className="amount">
                <span className="title">{card.title}</span>

                <span className={`amountValue ${card.valueClass || ""}`}>
                  {loading ? "..." : card.value}
                </span>
              </div>

              <div className={`icon ${card.iconClass}`}>{card.icon}</div>
            </div>

            <span className="cardDetail">{card.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

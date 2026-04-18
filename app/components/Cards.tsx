"use client";

import type { Transaction } from "../page";

type Props = {
  transactions: Transaction[];
  loading: boolean;
};

export default function Cards({ transactions, loading }: Props) {
  const income = transactions
    .filter((transaction) => transaction.type === "Income")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const expenses = transactions
    .filter((transaction) => transaction.type === "Expenses")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const balance = income - expenses;

  return (
    <div className="cardContainer">
      <h3 className="mainTitle">Overview</h3>

      <div className="cardWrapper">
        <div className="paymentCard lightGreen">
          <div className="cardHeader">
            <div className="amount">
              <span className="title">Total Income</span>
              <span className="amountValue">
                {loading ? "..." : `$${income.toFixed(2)}`}
              </span>
            </div>
            <div className="icon darkGreen">$</div>
          </div>
          <span className="cardDetail">All income transactions</span>
        </div>

        <div className="paymentCard lightRed">
          <div className="cardHeader">
            <div className="amount">
              <span className="title">Total Expenses</span>
              <span className="amountValue">
                {loading ? "..." : `$${expenses.toFixed(2)}`}
              </span>
            </div>
            <div className="icon darkRed">$</div>
          </div>
          <span className="cardDetail">All expense transactions</span>
        </div>

        <div className="paymentCard lightBlue">
          <div className="cardHeader">
            <div className="amount">
              <span className="title">Balance</span>
              <span
                className={`amountValue ${
                  balance >= 0 ? "positiveValue" : "negativeValue"
                }`}
              >
                {loading ? "..." : `$${balance.toFixed(2)}`}
              </span>
            </div>
            <div className="icon darkBlue">≡</div>
          </div>
          <span className="cardDetail">Current balance</span>
        </div>

        <div className="paymentCard lightPurple">
          <div className="cardHeader">
            <div className="amount">
              <span className="title">Transactions</span>
              <span className="amountValue">
                {loading ? "..." : transactions.length}
              </span>
            </div>
            <div className="icon darkPurple">#</div>
          </div>
          <span className="cardDetail">Total records</span>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import type { Transaction } from "../page";

type Budget = {
  id: string;
  category: string;
  amount: number;
};

type BudgetWithStats = Budget & {
  spent: number;
  remaining: number;
  progress: number;
  exceeded: boolean;
};

type Props = {
  transactions: Transaction[];
};

export default function BudgetManager({ transactions }: Props) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        transactions
          .map((transaction) => transaction.category?.trim())
          .filter((value): value is string => Boolean(value))
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [transactions]);

  const budgetsWithStats: BudgetWithStats[] = useMemo(() => {
    return budgets.map((budget) => {
      const spent = transactions
        .filter(
          (transaction) =>
            transaction.type === "Expenses" &&
            transaction.category?.toLowerCase() === budget.category.toLowerCase()
        )
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

      const budgetAmount = Number(budget.amount);
      const remaining = budgetAmount - spent;
      const progress =
        budgetAmount > 0 ? Math.min((spent / budgetAmount) * 100, 100) : 0;

      return {
        ...budget,
        amount: budgetAmount,
        spent,
        remaining,
        progress,
        exceeded: spent > budgetAmount,
      };
    });
  }, [budgets, transactions]);

  const fetchBudgets = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) return;

    const { data, error } = await supabase
      .from("budgets")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to load budgets");
      return;
    }

    setBudgets((data as Budget[]) || []);
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleAddBudget = async () => {
    const cleanCategory = category.trim();

    if (!cleanCategory || !amount) {
      toast.error("Please fill all fields");
      return;
    }

    setIsLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      toast.error("User not found");
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.from("budgets").insert([
      {
        category: cleanCategory,
        amount,
        user_id: user.id,
      },
    ]);

    setIsLoading(false);

    if (error) {
      toast.error("Failed to add budget");
      return;
    }

    toast.success("Budget added successfully");
    setCategory("");
    setAmount(0);
    await fetchBudgets();
  };

  const handleDeleteBudget = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this budget?"
    );
    if (!confirmed) return;

    const { error } = await supabase.from("budgets").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete budget");
      return;
    }

    toast.success("Budget deleted successfully");
    await fetchBudgets();
  };

  return (
    <div className="budgetCard">
      <h3 className="mainTitle">Budgets</h3>

      <div className="budgetForm">
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Select category</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Or create new category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <input
          type="number"
          placeholder="Budget amount"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />

        <button
          className="saveBtn"
          onClick={handleAddBudget}
          disabled={isLoading}
        >
          {isLoading ? "Adding..." : "Add Budget"}
        </button>
      </div>

      <div className="budgetList">
        {budgetsWithStats.length === 0 && (
          <div className="budgetEmpty">No budgets available</div>
        )}

        {budgetsWithStats.map((budget) => (
          <div key={budget.id} className="budgetItemCard">
            <div className="budgetItemTop">
              <div>
                <h4>{budget.category}</h4>
                <p>
                  Budget: ${budget.amount} | Spent: ${budget.spent}
                </p>
              </div>

              <button
                className="deleteBtn"
                onClick={() => handleDeleteBudget(budget.id)}
              >
                Delete
              </button>
            </div>

            <div className="budgetBar">
              <div
                className={`budgetBarFill ${
                  budget.exceeded ? "barExceeded" : ""
                }`}
                style={{ width: `${budget.progress}%` }}
              />
            </div>

            <div className="budgetMeta">
              <span>
                Remaining:{" "}
                <strong
                  className={budget.exceeded ? "dangerText" : undefined}
                >
                  ${budget.remaining}
                </strong>
              </span>

              {budget.exceeded && (
                <span className="dangerText">Budget exceeded</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
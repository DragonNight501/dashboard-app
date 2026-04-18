"use client";

import { useEffect, useState } from "react";
import AuthGuard from "./components/AuthGuard";
import Header from "./components/Header";
import Cards from "./components/Cards";
import OverviewChart from "./components/OverviewChart";
import StatusPieChart from "./components/StatusPieChart";
import MonthlyLineChart from "./components/MonthlyLineChart";
import ImportExcel from "./components/ImportExcel";
import BudgetManager from "./components/BudgetManager";
import Table from "./components/Table";
import { supabase } from "./lib/supabase";

export type Transaction = {
  id: number;
  date: string;
  type: string;
  description: string;
  amount: number;
  category: string;
  status: string;
  user_id: string;
};

export default function HomePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const user = userData.user;

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (error) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setTransactions((data as Transaction[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <AuthGuard>
      <main>
        <Header title="Dashboard" />

        <Cards transactions={transactions} loading={loading} />

        <div className="chartsGrid">
          <OverviewChart transactions={transactions} />
          <StatusPieChart transactions={transactions} />
        </div>

        <MonthlyLineChart transactions={transactions} />

        <BudgetManager transactions={transactions} />

        <ImportExcel fetchData={fetchData} />

        <Table
          data={transactions}
          loading={loading}
          fetchData={fetchData}
        />
      </main>
    </AuthGuard>
  );
}
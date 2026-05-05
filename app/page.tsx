"use client";

/* ===================== */
/* Imports */
/* ===================== */

import { useEffect, useState } from "react";
import AuthGuard from "./components/AuthGuard";
import Header from "./components/Header";
import Navbar from "./components/Navbar";
import Cards from "./components/Cards";
import OverviewChart from "./components/OverviewChart";
import StatusPieChart from "./components/StatusPieChart";
import MonthlyLineChart from "./components/MonthlyLineChart";
import ImportExcel from "./components/ImportExcel";
import BudgetManager from "./components/BudgetManager";
import Table from "./components/Table";
import { supabase } from "./lib/supabase";

/* ===================== */
/* Types */
/* Defines the transaction structure used across the dashboard.
 */
/* ===================== */

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

/* ===================== */
/* Home Page */
/* Main dashboard page responsible for loading user transactions
   and rendering the finance dashboard sections.
*/
/* ===================== */

export default function HomePage() {
  /* ===================== */
  /* State Management */
  /* ===================== */

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  /* ===================== */
  /* Fetch Transactions */
  /* Gets the authenticated user, then loads only their transactions.
   */
  /* ===================== */

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

  /* ===================== */
  /* Initial Data Load */
  /* Loads dashboard data once when the page mounts.
   */
  /* ===================== */

  useEffect(() => {
    fetchData();
  }, []);

  /* ===================== */
  /* UI Rendering */
  /* Dashboard structure:
     1. Header
     2. Summary cards
     3. Charts
     4. Budget manager
     5. Import action
     6. Transactions table
  */
  /* ===================== */

  return (
    <AuthGuard>
      <Navbar />
      <main className="dashboardPage">
        {/* ===================== */}
        {/* Header Section */}
        {/* ===================== */}

        <div className="dashboardTitleBlock">
          <h1>Dashboard</h1>
          <p>Track your income, expenses, budgets, and financial activity.</p>
        </div>

        {/* ===================== */}
        {/* Summary Section */}
        {/* Shows income, expenses, balance, and transaction count.
         */}
        {/* ===================== */}

        <section className="dashboardSection">
          <Cards transactions={transactions} loading={loading} />
        </section>

        {/* ===================== */}
        {/* Analytics Section */}
        {/* Shows finance overview and status distribution charts.
         */}
        {/* ===================== */}

        <section className="dashboardSection">
          <div className="chartsGrid">
            <OverviewChart transactions={transactions} />
            <StatusPieChart transactions={transactions} />
          </div>
        </section>

        {/* ===================== */}
        {/* Monthly Trend Section */}
        {/* Shows finance changes over time.
         */}
        {/* ===================== */}

        <section className="dashboardSection">
          <MonthlyLineChart transactions={transactions} />
        </section>

        {/* ===================== */}
        {/* Budget Section */}
        {/* Allows users to create budgets and compare spending.
         */}
        {/* ===================== */}

        <section className="dashboardSection">
          <BudgetManager transactions={transactions} />
        </section>

        {/* ===================== */}
        {/* Transactions Section */}
        {/* Contains import action and the transaction table.
         */}
        {/* ===================== */}

        <section className="dashboardSection">
          <div className="transactionsHeader">
            <div>
              <h3 className="mainTitle">Transaction Management</h3>
              <p className="sectionDescription">
                Import, filter, edit, export, and manage your financial records.
              </p>
            </div>

            <ImportExcel fetchData={fetchData} />
          </div>

          <Table data={transactions} loading={loading} fetchData={fetchData} />
        </section>
      </main>
    </AuthGuard>
  );
}

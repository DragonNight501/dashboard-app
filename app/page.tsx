"use client";

/* ===================== */
/* Dashboard */
/* ===================== */

import { useCallback, useEffect, useState } from "react";
import AuthGuard from "./components/AuthGuard";
import Navbar from "./components/layout/Navbar";
import DemoBanner from "./components/layout/DemoBanner";
import SummaryCards from "./components/dashboard/SummaryCards";
import CashFlowChart from "./components/dashboard/CashFlowChart";
import CategoryChart from "./components/dashboard/CategoryChart";
import BudgetManager from "./components/dashboard/BudgetManager";
import TransactionsTable from "./components/dashboard/TransactionsTable";
import { listTransactions } from "./lib/data";
import type { Transaction } from "./lib/types";

export default function HomePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Bumped when demo data is reset so every section reloads its data.
  const [dataVersion, setDataVersion] = useState(0);

  const refresh = useCallback(async () => {
    setTransactions(await listTransactions());
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      const rows = await listTransactions();
      if (!active) return;
      setTransactions(rows);
      setLoading(false);
    }

    void load();
    return () => {
      active = false;
    };
  }, [dataVersion]);

  return (
    <AuthGuard allowDemo>
      <Navbar />

      <main className="relative">
        <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-80" aria-hidden="true" />

        <div key={dataVersion} className="relative mx-auto w-full max-w-7xl space-y-6 px-4 pt-8 pb-20 sm:px-6">
          <DemoBanner onReset={() => setDataVersion((version) => version + 1)} />

          <SummaryCards transactions={transactions} loading={loading} />

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr] [&>*]:min-w-0">
            <CashFlowChart transactions={transactions} />
            <CategoryChart transactions={transactions} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_2.2fr] [&>*]:min-w-0">
            <BudgetManager transactions={transactions} />
            <TransactionsTable data={transactions} loading={loading} onChange={refresh} />
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}

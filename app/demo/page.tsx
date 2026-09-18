"use client";

/* ===================== */
/* /demo */
/* Shareable link that opens the dashboard with sample data in one click —
   e.g. for the "Live demo" button on a portfolio.
*/
/* ===================== */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { startDemo } from "../lib/demo";

export default function DemoPage() {
  const router = useRouter();

  useEffect(() => {
    startDemo();
    router.replace("/");
  }, [router]);

  return (
    <main className="grid min-h-screen place-items-center bg-paper" aria-busy="true">
      <p className="flex items-center gap-3 font-mono text-xs text-faint">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
        Preparing the demo…
      </p>
    </main>
  );
}

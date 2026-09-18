"use client";

/* ===================== */
/* Demo Banner */
/* Explains demo mode and offers reset / sign-up. Hidden for real users.
*/
/* ===================== */

import Link from "next/link";
import toast from "react-hot-toast";
import { FlaskConical, RotateCcw } from "lucide-react";
import { resetDemo, useDemoMode } from "../../lib/demo";

export default function DemoBanner({ onReset }: { onReset: () => void }) {
  const isDemo = useDemoMode();
  if (!isDemo) return null;

  function handleReset() {
    resetDemo();
    onReset();
    toast.success("Sample data restored");
  }

  return (
    <section
      aria-label="Demo mode"
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-pending/30 bg-pending/[0.07] px-5 py-4"
    >
      <div className="flex gap-3">
        <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-pending" />
        <div>
          <p className="font-medium">You are exploring the demo</p>
          <p className="mt-0.5 max-w-2xl text-sm text-muted">
            Six months of sample data. Add, edit, import and export freely — changes stay in this browser
            and never reach a server.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-secondary" onClick={handleReset}>
          <RotateCcw className="h-4 w-4" /> Reset data
        </button>
        <Link href="/signup" className="btn btn-primary">
          Create free account
        </Link>
      </div>
    </section>
  );
}

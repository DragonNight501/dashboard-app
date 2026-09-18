"use client";

/* ===================== */
/* Demo Banner */
/* Explains demo mode and offers reset / sign-up. Renders nothing for
   signed-in users.
*/
/* ===================== */

import Link from "next/link";
import toast from "react-hot-toast";
import { resetDemo, useDemoMode } from "../lib/demo";

type DemoBannerProps = {
  onReset: () => void;
};

export default function DemoBanner({ onReset }: DemoBannerProps) {
  const isDemo = useDemoMode();

  if (!isDemo) return null;

  function handleReset() {
    resetDemo();
    onReset();
    toast.success("Demo data restored");
  }

  return (
    <section className="demoBanner" aria-label="Demo mode">
      <div>
        <p className="demoBannerTitle">You are exploring the demo</p>
        <p className="demoBannerText">
          Sample data for the last six months. Add, edit, import and export freely —
          changes stay in this browser only and never reach a server.
        </p>
      </div>

      <div className="demoBannerActions">
        <button type="button" className="demoGhostBtn" onClick={handleReset}>
          Reset sample data
        </button>
        <Link href="/signup" className="demoPrimaryBtn">
          Create a free account
        </Link>
      </div>
    </section>
  );
}

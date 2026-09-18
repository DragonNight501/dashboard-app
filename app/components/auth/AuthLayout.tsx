/* ===================== */
/* Auth Layout */
/* Split screen: product story on the left (large screens), form on the right.
*/
/* ===================== */

import type { ReactNode } from "react";
import Link from "next/link";
import { ChartNoAxesCombined, FileSpreadsheet, Target, Wallet } from "lucide-react";

const features = [
  { icon: ChartNoAxesCombined, title: "Cash flow at a glance", text: "Income, expenses and net result for every month." },
  { icon: Target, title: "Monthly budgets", text: "Limits per category that reset each month." },
  { icon: FileSpreadsheet, title: "Excel & CSV", text: "Import bank exports, export filtered views." },
];

type AuthLayoutProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
};

export default function AuthLayout({ eyebrow, title, subtitle, children }: AuthLayoutProps) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden border-r border-line bg-surface-2/40 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -top-40 -left-20 h-[420px] w-[520px] rounded-full bg-accent/15 blur-[120px]"
          aria-hidden="true"
        />

        <Link href="/login" className="relative flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-line-strong bg-surface text-accent">
            <Wallet className="h-4 w-4" />
          </span>
          FinTrack
        </Link>

        <div className="relative max-w-md">
          <p className="eyebrow">Personal finance</p>
          <h2 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-balance">
            See where your money <span className="text-gradient">actually goes.</span>
          </h2>

          <ul className="mt-10 space-y-5">
            {features.map(({ icon: Icon, title: featureTitle, text }) => (
              <li key={featureTitle} className="flex gap-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-surface text-accent">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium">{featureTitle}</p>
                  <p className="text-sm text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative font-mono text-[11px] text-faint">Next.js · Supabase · Recharts</p>
      </aside>

      <section className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <Link href="/login" className="mb-10 flex items-center gap-2.5 font-semibold tracking-tight lg:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-line-strong bg-surface text-accent">
              <Wallet className="h-4 w-4" />
            </span>
            FinTrack
          </Link>

          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">{title}</h1>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>

          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  );
}

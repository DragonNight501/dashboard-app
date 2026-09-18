"use client";

/* ===================== */
/* Navbar */
/* ===================== */

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { LayoutDashboard, LogOut, UserRound, Wallet } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { supabase } from "../../lib/supabase";
import { exitDemo, useDemoMode } from "../../lib/demo";
import { friendlyError } from "../../lib/format";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const isDemo = useDemoMode();
  const [leaving, setLeaving] = useState(false);

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    ...(isDemo ? [] : [{ href: "/profile", label: "Profile", icon: UserRound }]),
  ];

  async function handleLeave() {
    if (leaving) return;

    if (isDemo) {
      exitDemo();
      toast.success("Demo closed");
      router.replace("/login");
      return;
    }

    setLeaving(true);
    const { error } = await supabase.auth.signOut();
    setLeaving(false);

    if (error) {
      toast.error(friendlyError(error.message, "Failed to log out"));
      return;
    }

    toast.success("Logged out");
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-line-strong bg-surface text-accent">
              <Wallet className="h-4 w-4" />
            </span>
            <span className="hidden sm:inline">FinTrack</span>
          </Link>
          {isDemo ? (
            <span className="badge bg-pending/15 font-mono text-[10px] tracking-[0.2em] text-pending uppercase">
              Demo
            </span>
          ) : null}
        </div>

        <nav aria-label="Main" className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                  active ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface-2 hover:text-fg"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}

          <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
          <ThemeToggle />

          <button
            type="button"
            onClick={handleLeave}
            disabled={leaving}
            className="btn btn-ghost px-3"
            aria-label={isDemo ? "Exit demo" : "Log out"}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">{isDemo ? "Exit demo" : leaving ? "Logging out…" : "Log out"}</span>
          </button>
        </nav>
      </div>
    </header>
  );
}

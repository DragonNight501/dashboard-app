"use client";

/* ===================== */
/* Login */
/* ===================== */

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowRight, FlaskConical } from "lucide-react";
import AuthLayout from "../components/auth/AuthLayout";
import { useRedirectIfSignedIn } from "../components/auth/useRedirectIfSignedIn";
import { login } from "../lib/auth";
import { exitDemo, startDemo } from "../lib/demo";
import { friendlyError } from "../lib/format";

export default function LoginPage() {
  const router = useRouter();
  const checking = useRedirectIfSignedIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");
    const loginError = await login(email.trim(), password);
    setLoading(false);

    if (loginError) {
      setError(friendlyError(loginError.message, "Login failed"));
      return;
    }

    // A real account replaces any demo session in this browser.
    exitDemo();
    toast.success("Welcome back");
    router.push("/");
  }

  function handleDemo() {
    startDemo();
    toast.success("Welcome to the demo");
    router.push("/");
  }

  return (
    <AuthLayout eyebrow="Welcome back" title="Log in" subtitle="Manage your transactions, budgets and analytics.">
      <form onSubmit={handleLogin} className="space-y-4" aria-busy={checking}>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="field"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <label className="label" htmlFor="password">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs text-muted hover:text-accent">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            className="field"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={loading}
          />
        </div>

        {error ? (
          <p role="alert" className="rounded-lg bg-expense/10 px-3 py-2 text-sm text-expense">
            {error}
          </p>
        ) : null}

        <button type="submit" className="btn btn-primary w-full py-2.5" disabled={loading || checking}>
          {loading ? "Logging in…" : "Log in"} <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        No account yet?{" "}
        <Link href="/signup" className="font-medium text-fg hover:text-accent">
          Create one
        </Link>
      </p>

      <div className="my-6 flex items-center gap-3 font-mono text-[11px] tracking-[0.2em] text-faint uppercase" role="separator">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>

      <button
        type="button"
        onClick={handleDemo}
        disabled={loading}
        className="group flex w-full items-center gap-4 rounded-xl border border-dashed border-accent/40 bg-accent/[0.04] px-4 py-3.5 text-left transition hover:border-accent/70 hover:bg-accent/[0.08]"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
          <FlaskConical className="h-4 w-4" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-medium">Explore the demo</span>
          <span className="block text-xs text-muted">No account needed · six months of sample data</span>
        </span>
        <ArrowRight className="h-4 w-4 text-faint transition group-hover:translate-x-0.5 group-hover:text-accent" />
      </button>
    </AuthLayout>
  );
}

"use client";

/* ===================== */
/* Forgot Password */
/* ===================== */

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import AuthLayout from "../components/auth/AuthLayout";
import { supabase } from "../lib/supabase";
import { friendlyError } from "../lib/format";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleReset(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    if (!email.trim()) return setError("Please enter your email.");

    setLoading(true);
    setError("");

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (resetError) return setError(friendlyError(resetError.message, "Could not send the email"));
    setSent(true);
  }

  return (
    <AuthLayout
      eyebrow="Security"
      title="Reset your password"
      subtitle="Enter your email and we will send you a link to choose a new password."
    >
      {sent ? (
        <div className="card flex gap-3 rounded-xl p-4 text-sm text-muted">
          <MailCheck className="h-5 w-5 shrink-0 text-income" />
          If an account exists for {email.trim()}, a reset link is on its way.
        </div>
      ) : (
        <form onSubmit={handleReset} className="space-y-4" noValidate>
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="field"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={loading}
            />
          </div>
          {error ? (
            <p role="alert" className="rounded-lg bg-expense/10 px-3 py-2 text-sm text-expense">
              {error}
            </p>
          ) : null}
          <button type="submit" className="btn btn-primary w-full py-2.5" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}

      <p className="mt-5 text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-fg hover:text-accent">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}

"use client";

/* ===================== */
/* Reset Password */
/* Only usable from a valid recovery link: Supabase turns the link into a
   temporary session. Without one, the page explains instead of failing.
*/
/* ===================== */

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import AuthLayout from "../components/auth/AuthLayout";
import { supabase } from "../lib/supabase";
import { friendlyError } from "../lib/format";

const MIN_PASSWORD = 8;

export default function ResetPasswordPage() {
  const router = useRouter();

  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN")) setStatus("ready");
    });

    async function check() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;
      if (session) return setStatus("ready");

      // Give the recovery link in the URL a moment to be exchanged.
      setTimeout(() => {
        if (active) setStatus((current) => (current === "checking" ? "invalid" : current));
      }, 2500);
    }

    void check();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleUpdate(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    if (password.length < MIN_PASSWORD) return setError(`Password must be at least ${MIN_PASSWORD} characters.`);
    if (password !== confirm) return setError("Passwords do not match.");

    setLoading(true);
    setError("");
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) return setError(friendlyError(updateError.message, "Could not update the password"));

    toast.success("Password updated");
    router.replace("/");
  }

  return (
    <AuthLayout eyebrow="Security" title="Choose a new password" subtitle="Use at least 8 characters.">
      {status === "checking" ? (
        <p className="font-mono text-xs text-faint">Verifying your reset link…</p>
      ) : status === "invalid" ? (
        <div className="space-y-4">
          <p role="alert" className="rounded-lg bg-expense/10 px-3 py-2 text-sm text-expense">
            This reset link is invalid or has expired.
          </p>
          <Link href="/forgot-password" className="btn btn-primary w-full py-2.5">
            Request a new link
          </Link>
        </div>
      ) : (
        <form onSubmit={handleUpdate} className="space-y-4" noValidate>
          <div>
            <label className="label" htmlFor="password">
              New password
            </label>
            <input
              id="password"
              className="field"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label className="label" htmlFor="confirm">
              Confirm password
            </label>
            <input
              id="confirm"
              className="field"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              disabled={loading}
            />
          </div>
          {error ? (
            <p role="alert" className="rounded-lg bg-expense/10 px-3 py-2 text-sm text-expense">
              {error}
            </p>
          ) : null}
          <button type="submit" className="btn btn-primary w-full py-2.5" disabled={loading}>
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}

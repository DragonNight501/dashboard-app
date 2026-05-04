"use client";

/* ===================== */
/* Imports */
/* ===================== */

import { useState } from "react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import Link from "next/link";

/* ===================== */
/* Forgot Password Page */
/* Sends reset password email to user */
/* ===================== */

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();

    if (loading) return;
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Sending reset link...");

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/reset-password`
        : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    toast.dismiss(toastId);
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setSent(true);
    toast.success("Reset email sent");
  }

  return (
    <main className="authPage">
      <form className="authForm" onSubmit={handleReset}>
        <div className="authHeader">
          <p className="authEyebrow">Security</p>
          <h1>Reset Password</h1>
          <p className="authSubtitle">
            Enter your email and we will send you a reset link.
          </p>
        </div>

        {sent ? (
          <div className="authSuccessBox">
            <p>Check your email for the reset link.</p>
            <Link href="/login" className="authPrimaryLink">
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <div className="authFields">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button className="saveBtn" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <p className="authSwitchText">
              Remember your password?{" "}
              <Link href="/login" className="authSwitchLink">
                Login
              </Link>
            </p>
          </>
        )}
      </form>
    </main>
  );
}

"use client";

/* ===================== */
/* Sign Up */
/* ===================== */

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";
import AuthLayout from "../components/auth/AuthLayout";
import { useRedirectIfSignedIn } from "../components/auth/useRedirectIfSignedIn";
import { supabase } from "../lib/supabase";
import { exitDemo, startDemo } from "../lib/demo";
import { friendlyError } from "../lib/format";

const MIN_PASSWORD = 8;

export default function SignupPage() {
  const router = useRouter();
  const checking = useRedirectIfSignedIn();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");

  function validate() {
    if (!fullName.trim()) return "Please enter your name.";
    if (!email.trim()) return "Please enter your email.";
    if (password.length < MIN_PASSWORD) return `Password must be at least ${MIN_PASSWORD} characters.`;
    if (password !== confirmPassword) return "Passwords do not match.";
    return "";
  }

  async function handleSignup(event: FormEvent) {
    event.preventDefault();
    if (loading) return;

    const problem = validate();
    if (problem) return setError(problem);

    setLoading(true);
    setError("");

    const { error: signupError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: { full_name: fullName.trim() },
      },
    });

    setLoading(false);

    if (signupError) return setError(friendlyError(signupError.message, "Sign-up failed"));

    exitDemo();
    setSentTo(email.trim());
  }

  if (sentTo) {
    return (
      <AuthLayout eyebrow="Almost there" title="Check your inbox" subtitle={`We sent a confirmation link to ${sentTo}.`}>
        <div className="card flex gap-3 rounded-xl p-4 text-sm text-muted">
          <MailCheck className="h-5 w-5 shrink-0 text-income" />
          Open the link to activate your account, then log in. It can take a minute to arrive — check your spam
          folder too.
        </div>
        <Link href="/login" className="btn btn-primary mt-6 w-full py-2.5">
          Go to login
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout eyebrow="Get started" title="Create your account" subtitle="Free, and your data stays yours.">
      <form onSubmit={handleSignup} className="space-y-4" noValidate aria-busy={checking}>
        <div>
          <label className="label" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            className="field"
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            disabled={loading}
          />
        </div>
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="password">
              Password
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
              Confirm
            </label>
            <input
              id="confirm"
              className="field"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        <p className="text-xs text-faint">At least {MIN_PASSWORD} characters.</p>

        {error ? (
          <p role="alert" className="rounded-lg bg-expense/10 px-3 py-2 text-sm text-expense">
            {error}
          </p>
        ) : null}

        <button type="submit" className="btn btn-primary w-full py-2.5" disabled={loading || checking}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-fg hover:text-accent">
          Log in
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-muted">
        Just looking?{" "}
        <button
          type="button"
          className="font-medium text-accent hover:underline"
          onClick={() => {
            startDemo();
            router.push("/");
          }}
        >
          Try the demo
        </button>
      </p>
    </AuthLayout>
  );
}

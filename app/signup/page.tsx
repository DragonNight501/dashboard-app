"use client";

/* ===================== */
/* Imports */
/* ===================== */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import Link from "next/link";
import { startDemo } from "../lib/demo";

/* ===================== */
/* Signup Page */
/* Creates a new user account and asks the user to confirm their email.
 */
/* ===================== */

export default function SignupPage() {
  const router = useRouter();

  /* ===================== */
  /* State Management */
  /* ===================== */

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [signupSuccess, setSignupSuccess] = useState(false);

  /* ===================== */
  /* Session Check */
  /* Redirects authenticated users away from signup page.
   */
  /* ===================== */

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace("/");
        return;
      }

      setChecking(false);
    };

    checkSession();
  }, [router]);

  /* ===================== */
  /* Form Validation */
  /* Validates fields before sending signup request.
   */
  /* ===================== */

  function validateForm() {
    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return false;
    }

    if (!email.trim()) {
      toast.error("Please enter your email");
      return false;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }

    return true;
  }

  /* ===================== */
  /* Signup Handler */
  /* Creates account and sends confirmation email if Supabase email confirmation is enabled.
   */
  /* ===================== */

  async function handleSignup(event: React.FormEvent) {
    event.preventDefault();

    if (loading) return;
    if (!validateForm()) return;

    setLoading(true);

    const loadingToast = toast.loading("Creating account...");

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/login`
        : undefined;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          full_name: fullName.trim(),
        },
      },
    });

    toast.dismiss(loadingToast);
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setSignupSuccess(true);
    toast.success("Account created. Please check your email.");
  }

  /* ===================== */
  /* Loading State */
  /* ===================== */

  if (checking) {
    return (
      <main className="authPage">
        <div className="authForm">
          <p className="authSwitchText">Checking session...</p>
        </div>
      </main>
    );
  }

  /* ===================== */
  /* Success State */
  /* ===================== */

  if (signupSuccess) {
    return (
      <main className="authPage">
        <div className="authForm">
          <div className="authHeader">
            <p className="authEyebrow">Email Confirmation</p>
            <h1>Check your inbox</h1>
            <p className="authSubtitle">
              We sent a confirmation link to your email. Confirm your account,
              then return to login.
            </p>
          </div>

          <Link href="/login" className="authPrimaryLink">
            Go to Login
          </Link>
        </div>
      </main>
    );
  }

  /* ===================== */
  /* UI Rendering */
  /* ===================== */

  return (
    <main className="authPage">
      <form className="authForm" onSubmit={handleSignup}>
        <div className="authHeader">
          <p className="authEyebrow">Finance Dashboard</p>
          <h1>Create Account</h1>
          <p className="authSubtitle">
            Start managing your income, expenses, budgets, and financial
            insights.
          </p>
        </div>

        <div className="authFields">
          <input
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
            disabled={loading}
          />

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={loading}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={loading}
          />

          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            disabled={loading}
          />
        </div>

        <button type="submit" className="saveBtn" disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <p className="authSwitchText">
          Already have an account?{" "}
          <Link href="/login" className="authSwitchLink">
            Login
          </Link>
        </p>

        <p className="authSwitchText">
          Just looking?{" "}
          <button
            type="button"
            className="authSwitchLink authLinkButton"
            onClick={() => {
              startDemo();
              router.push("/");
            }}
          >
            Try the demo
          </button>
        </p>
      </form>
    </main>
  );
}

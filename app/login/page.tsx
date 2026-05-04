"use client";

/* ===================== */
/* Imports */
/* ===================== */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { login } from "../lib/auth";
import toast from "react-hot-toast";
import Link from "next/link";

/* ===================== */
/* Login Page */
/* Handles user authentication and redirects authenticated users.
 */
/* ===================== */

export default function LoginPage() {
  const router = useRouter();

  /* ===================== */
  /* State Management */
  /* ===================== */

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  /* ===================== */
  /* Session Check */
  /* Redirects logged-in users away from the login page.
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
  /* Login Handler */
  /* Authenticates the user with Supabase.
   */
  /* ===================== */

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    if (loading) return;

    setLoading(true);

    const loadingToast = toast.loading("Logging in...");

    const error = await login(email, password);

    toast.dismiss(loadingToast);
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Logged in successfully");
    router.push("/");
  };

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
  /* UI Rendering */
  /* ===================== */

  return (
    <main className="authPage">
      <form className="authForm" onSubmit={handleLogin}>
        <div className="authHeader">
          <p className="authEyebrow">Finance Dashboard</p>
          <h1>Welcome Back</h1>
          <p className="authSubtitle">
            Log in to manage your transactions, budgets, and analytics.
          </p>
        </div>

        <div className="authFields">
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
        </div>

        <button type="submit" className="saveBtn" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="authSwitchText">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="authSwitchLink">
            Create one
          </Link>
        </p>
      </form>
    </main>
  );
}

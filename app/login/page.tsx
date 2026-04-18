"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { login } from "../lib/auth";
import toast from "react-hot-toast";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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

    toast.success("You login in Seccessfully");
    router.push("/");
  };

  if (checking) {
    return <p style={{ padding: "2rem" }}>Loading...</p>;
  }

  return (
  <main className="authPage">
    <form className="authForm" onSubmit={handleLogin}>
      <h1>Login</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={loading}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        disabled={loading}
      />

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
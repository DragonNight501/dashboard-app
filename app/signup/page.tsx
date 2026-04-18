"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { signup } from "../lib/auth";
import toast from "react-hot-toast";

export default function SignupPage() {
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    const loadingToast = toast.loading("Creating account...");

    const error = await signup(email, password);

    toast.dismiss(loadingToast);
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("تم إنشاء الحساب");
    router.push("/login");
  };

  if (checking) {
    return <p style={{ padding: "2rem" }}>Loading...</p>;
  }

  return (
    <main className="authPage">
      <form className="authForm" onSubmit={handleSignup}>
        <h1>Create Account</h1>

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
          {loading ? "Creating..." : "Sign Up"}
        </button>
      </form>
    </main>
  );
}
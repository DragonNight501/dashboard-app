"use client";

/* ===================== */
/* Imports */
/* ===================== */

import { useState } from "react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

/* ===================== */
/* Reset Password Page */
/* Allows user to set new password */
/* ===================== */

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();

    if (loading) return;

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Updating password...");

    const { error } = await supabase.auth.updateUser({
      password,
    });

    toast.dismiss(toastId);
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password updated successfully");
    router.push("/login");
  }

  return (
    <main className="authPage">
      <form className="authForm" onSubmit={handleUpdate}>
        <div className="authHeader">
          <p className="authEyebrow">Security</p>
          <h1>Set New Password</h1>
          <p className="authSubtitle">
            Choose a strong password for your account.
          </p>
        </div>

        <div className="authFields">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />

          <input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <button className="saveBtn" disabled={loading}>
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </main>
  );
}

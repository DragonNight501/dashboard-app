"use client";

/* ===================== */
/* Imports */
/* ===================== */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

/* ===================== */
/* Logout Button */
/* Signs the user out and redirects to login.
 */
/* ===================== */

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;

    setLoading(true);

    const loadingToast = toast.loading("Logging out...");

    const { error } = await supabase.auth.signOut();

    toast.dismiss(loadingToast);
    setLoading(false);

    if (error) {
      toast.error("Failed to log out");
      return;
    }

    toast.success("Logged out successfully");
    router.replace("/login");
  }

  return (
    <button className="logoutBtn" onClick={handleLogout} disabled={loading}>
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}

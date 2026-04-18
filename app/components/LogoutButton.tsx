"use client";

import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        toast.error("Failed to log out");
        return;
      }

      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Something went wrong");
    }
  };

  return (
    <button className="logoutBtn" onClick={handleLogout}>
      Logout
    </button>
  );
}
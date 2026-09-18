"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ThemeToggle from "./ThemeToggle";
import LogoutButton from "./LogoutButton";
import { exitDemo, useDemoMode } from "../lib/demo";

export default function Navbar() {
  const router = useRouter();
  const isDemo = useDemoMode();

  function handleExitDemo() {
    exitDemo();
    toast.success("Demo closed");
    router.replace("/login");
  }

  return (
    <header className="navbar">
      <div className="navLeft">
        <h2 className="logo">💸 FinanceTracker</h2>
        {isDemo ? <span className="demoBadge">Demo</span> : null}
      </div>

      <div className="navRight">
        {isDemo ? null : (
          <button className="navBtn" onClick={() => router.push("/profile")}>
            Profile
          </button>
        )}

        <ThemeToggle />

        {isDemo ? (
          <button className="logoutBtn" onClick={handleExitDemo}>
            Exit demo
          </button>
        ) : (
          <LogoutButton />
        )}
      </div>
    </header>
  );
}

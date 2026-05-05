"use client";

import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import LogoutButton from "./LogoutButton";

export default function Navbar() {
  const router = useRouter();

  return (
    <header className="navbar">
      <div className="navLeft">
        <h2 className="logo">💸 FinanceTracker</h2>
      </div>

      <div className="navRight">
        <button className="navBtn" onClick={() => router.push("/profile")}>
          Profile
        </button>

        <ThemeToggle />
        <LogoutButton />
      </div>
    </header>
  );
}

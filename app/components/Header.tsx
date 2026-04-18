"use client";

import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import LogoutButton from "./LogoutButton";

export default function Header({ title = "Dashboard" }: { title?: string }) {
  const router = useRouter();

  return (
    <div className="topBar">
      <h2>{title}</h2>

      <div className="topActions">
        <button
          className="backBtn"
          onClick={() => router.push("/profile")}
        >
          Profile
        </button>

        <ThemeToggle />
        <LogoutButton />
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;

    if (savedTheme === "dark") {
      document.body.classList.add("dark");
      setTheme("dark");
    } else {
      document.body.classList.remove("dark");
      setTheme("light");
    }
  }, []);

  const handleToggle = () => {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";

    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.body.classList.toggle("dark", nextTheme === "dark");
  };

  return (
    <button type="button" className="themeToggleBtn" onClick={handleToggle}>
      {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}
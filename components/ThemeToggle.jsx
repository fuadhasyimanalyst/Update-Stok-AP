"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const STORAGE_KEY = "update-stok-theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState(null); // null = belum dibaca dari localStorage

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const initial = saved || (prefersDark ? "dark" : "light");
    applyTheme(initial);
  }, []);

  function applyTheme(next) {
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(STORAGE_KEY, next);
    setTheme(next);
  }

  function toggle() {
    applyTheme(theme === "dark" ? "light" : "dark");
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      title={isDark ? "Mode Siang" : "Mode Malam"}
      aria-label={isDark ? "Ganti ke mode siang" : "Ganti ke mode malam"}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--ink-300,#b5b5bd)] transition-colors"
    >
      {theme === null ? (
        <span className="h-[14px] w-[14px]" />
      ) : isDark ? (
        <>
          <Sun size={14} /> <span className="hidden sm:inline">Siang</span>
        </>
      ) : (
        <>
          <Moon size={14} /> <span className="hidden sm:inline">Malam</span>
        </>
      )}
    </button>
  );
}

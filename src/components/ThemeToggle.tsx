// src/components/ThemeToggle.tsx
"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const activeDark = saved === "dark" || (!saved && prefersDark);
      setIsDark(activeDark);
      if (activeDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {
      try {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setIsDark(prefersDark);
      } catch {
        setIsDark(false);
      }
    }
  }, []);

  function toggleTheme() {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      try {
        localStorage.setItem("theme", "dark");
      } catch {}
    } else {
      document.documentElement.classList.remove("dark");
      try {
        localStorage.setItem("theme", "light");
      } catch {}
    }
  }

  // Before mount, render button with placeholder icon to avoid layout shift and preserve 44x44 tap target
  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle dark mode"
        className={`min-w-[44px] min-h-[44px] w-11 h-11 inline-flex items-center justify-center rounded-card border border-card-border bg-card text-foreground transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${className}`}
      >
        <span className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className={`min-w-[44px] min-h-[44px] w-11 h-11 inline-flex items-center justify-center rounded-card border border-card-border bg-card hover:bg-card-hover text-foreground transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${className}`}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-foreground" aria-hidden="true" />
      ) : (
        <Moon className="w-5 h-5 text-foreground" aria-hidden="true" />
      )}
    </button>
  );
}

export default ThemeToggle;

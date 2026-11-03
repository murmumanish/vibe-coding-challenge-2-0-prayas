"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  StadiumIcon,
  PeopleIcon,
  ScoutIcon,
  AlertIcon,
  TargetIcon,
} from "@/components/Icons";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e?: React.FormEvent, customEmail?: string, customPassword?: string) {
    if (e) e.preventDefault();
    setError("");

    const targetEmail = customEmail ?? email;
    const targetPassword = customPassword ?? password;

    if (!targetEmail || !targetPassword) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: targetPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed. Please check credentials.");
        return;
      }

      const role = data.user.role;
      router.push(`/${role}`);
      router.refresh();
    } catch {
      setError("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function fillCredentials(fillEmail: string, fillPass: string) {
    setEmail(fillEmail);
    setPassword(fillPass);
    handleLogin(undefined, fillEmail, fillPass);
  }

  return (
    <div className="relative bg-white/95 dark:bg-[#18202c]/95 backdrop-blur-md py-8 sm:py-10 px-5 sm:px-10 shadow-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800 transition-colors">
      {/* Night mode toggle in top corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Academy Brand Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#ADD8E6] text-slate-900 shadow-md mb-3 border border-blue-200">
          <StadiumIcon className="w-8 h-8 text-slate-900" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Sports Academy Desk
        </h1>
        <p className="text-[11px] uppercase tracking-widest text-slate-600 dark:text-slate-300 font-bold mt-1">
          Dumka Academy Portal
        </p>
      </div>

      {/* Quick Test Login Helpers (No Emojis) */}
      <div className="mb-6 p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl">
        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center mb-2.5">
          One-Click Demo Login
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fillCredentials("coach@academy.com", "coach123")}
            className="flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl bg-[#ADD8E6]/40 dark:bg-[#ADD8E6]/15 text-slate-900 dark:text-slate-100 hover:bg-[#ADD8E6]/60 transition-colors border border-blue-200 dark:border-blue-900/50"
          >
            <PeopleIcon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <span>Coach Demo</span>
          </button>
          <button
            type="button"
            onClick={() => fillCredentials("scout@academy.com", "scout123")}
            className="flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors border border-emerald-200 dark:border-emerald-800"
          >
            <ScoutIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Scout Demo</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 p-3.5 text-xs font-semibold text-red-700 dark:text-red-300 flex items-start gap-2.5">
          <AlertIcon className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white shadow-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#ADD8E6] focus:outline-none focus:ring-2 focus:ring-[#ADD8E6]/40 text-xs sm:text-sm transition"
            placeholder="coach@academy.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white shadow-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#ADD8E6] focus:outline-none focus:ring-2 focus:ring-[#ADD8E6]/40 text-xs sm:text-sm transition"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 rounded-xl bg-[#ADD8E6] hover:bg-[#9cd0e2] py-3 text-xs sm:text-sm font-bold text-slate-900 shadow-sm border border-blue-300 focus:outline-none focus:ring-2 focus:ring-[#ADD8E6] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition transform active:scale-[0.99]"
        >
          {loading ? "Signing in..." : "Sign In to Desk"}
        </button>
      </form>
    </div>
  );
}

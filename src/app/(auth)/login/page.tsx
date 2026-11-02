"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="bg-white/95 backdrop-blur-sm py-10 px-6 sm:px-10 shadow-2xl rounded-2xl border border-white/20">
      {/* Academy Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-indigo-500/30 mb-4 text-3xl">
          🏟️
        </div>
        <h1 className="text-2xl font-black tracking-tight text-gray-900">
          Sports Academy Desk
        </h1>
        <p className="text-xs uppercase tracking-widest text-indigo-600 font-semibold mt-1">
          Dumka Academy Portal
        </p>
      </div>

      {/* Quick Test Login Helpers */}
      <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-2">
          ⚡ One-Click Quick Login
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fillCredentials("coach@academy.com", "coach123")}
            className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200"
          >
            <span>👔</span> Coach Demo
          </button>
          <button
            type="button"
            onClick={() => fillCredentials("scout@academy.com", "scout123")}
            className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200"
          >
            <span>🔍</span> Scout Demo
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-start gap-3">
          <span className="text-lg leading-none">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1"
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
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 text-sm transition"
            placeholder="coach@academy.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1"
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
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 text-sm transition"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition transform active:scale-[0.99]"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              Signing in...
            </span>
          ) : (
            "Sign In to Desk"
          )}
        </button>
      </form>
    </div>
  );
}

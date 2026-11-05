"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { AlertIcon, AddIcon } from "@/components/Icons";

interface Sport {
  _id: string;
  name: string;
  isActive: boolean;
}

export function PlayerForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [sportId, setSportId] = useState("");
  const [sports, setSports] = useState<Sport[]>([]);

  // Option 1: Student Login Credentials
  const [createLogin, setCreateLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/sports?activeOnly=true")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.sports) setSports(data.sports);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 5 || parsedAge > 60) {
      setError("Age must be between 5 and 60.");
      return;
    }

    if (!sportId) {
      setError("Please select a sport for this player.");
      return;
    }

    if (createLogin) {
      if (!email.trim()) {
        setError("Please enter a valid student email address.");
        return;
      }
      if (!password || password.length < 6) {
        setError("Student password must be at least 6 characters long.");
        return;
      }
    }

    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        age: parsedAge,
        sportId,
      };

      if (phone.trim()) {
        payload.phone = phone.trim();
      }

      if (createLogin && email.trim()) {
        payload.email = email.trim();
        payload.password = password;
      }

      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to add player.");
        return;
      }

      router.push("/coach/players");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-xl bg-white dark:bg-[#18202c] p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors"
    >
      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-4 text-xs font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
          <AlertIcon className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Basic Player Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          1. Player Profile
        </h3>

        <Input
          id="name"
          label="Full Name"
          placeholder="e.g. Ramesh Hansda"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="age"
            type="number"
            label="Age"
            placeholder="e.g. 17"
            min={5}
            max={60}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
          />

          <Select
            id="sport"
            label="Sport (1 per player)"
            placeholder="-- Choose Sport --"
            options={sports.map((s) => ({ value: s._id, label: s.name }))}
            value={sportId}
            onChange={(e) => setSportId(e.target.value)}
            required
          />
        </div>

        <Input
          id="phone"
          type="tel"
          label="Contact Phone Number (Optional)"
          placeholder="e.g. +91 98765 43210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      {sports.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl p-3">
          <AlertIcon className="w-4 h-4 shrink-0" />
          <span>
            No active sports found. Please configure a sport in{" "}
            <a href="/coach/sports" className="underline font-bold">
              Sports Settings
            </a>{" "}
            before adding players.
          </span>
        </div>
      )}

      {/* Option 1: Student Login Portal Account */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <input
            id="create-login-checkbox"
            type="checkbox"
            checked={createLogin}
            onChange={(e) => setCreateLogin(e.target.checked)}
            className="mt-1 h-4 w-4 rounded-md border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-blue-600 focus:ring-[#ADD8E6]"
          />
          <div>
            <label
              htmlFor="create-login-checkbox"
              className="text-sm font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              Enable Student Portal Login (Option 1)
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Create student credentials so they can log into the academy portal to view their attendance, match scores, and trial readiness.
            </p>
          </div>
        </div>

        {createLogin && (
          <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in duration-200">
            <Input
              id="student-email"
              type="email"
              label="Student Email Address"
              placeholder="e.g. ramesh@academy.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required={createLogin}
            />

            <Input
              id="student-password"
              type="password"
              label="Initial Password (min 6 chars)"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={createLogin}
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Button type="submit" loading={loading} disabled={sports.length === 0} className="w-full sm:w-auto gap-1.5">
          <AddIcon className="w-4 h-4" /> Register Player
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/coach/players")}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

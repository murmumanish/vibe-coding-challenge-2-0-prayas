"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Select } from "@/components/Select";
import { Input } from "@/components/Input";
import { AlertIcon, ClipboardIcon } from "@/components/Icons";
import { getISTDateKey } from "@/lib/utils";

interface Sport {
  _id: string;
  name: string;
  isActive: boolean;
}

interface SessionFormProps {
  sports: Sport[];
}

export function SessionForm({ sports }: SessionFormProps) {
  const router = useRouter();
  const [sportId, setSportId] = useState(sports.length > 0 ? sports[0]._id : "");
  const [dateKey, setDateKey] = useState(getISTDateKey());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sportId || !dateKey) {
      setError("Please select both a sport and a session date.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sportId, dateKey }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create session");
        return;
      }

      // Navigate straight to newly created session's attendance sheet
      router.push(`/coach/sessions/${data.session._id}`);
    } catch {
      setError("Something went wrong. Please check your network.");
    } finally {
      setLoading(false);
    }
  }

  const sportOptions = sports.map((s) => ({
    value: s._id,
    label: s.name,
  }));

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18202c] p-6 shadow-xs max-w-2xl transition-colors">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300">
          <ClipboardIcon className="w-4 h-4" />
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Daily Practice Session Details
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Opening a session automatically creates attendance records marked as absent for active players.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-3 text-xs font-semibold text-red-700 dark:text-red-400">
          <AlertIcon className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          id="sportId"
          label="Select Academy Sport"
          value={sportId}
          onChange={(e) => setSportId(e.target.value)}
          options={sportOptions}
          placeholder={sports.length === 0 ? "No active sports available" : undefined}
          required
        />

        {sports.length === 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            No active sports found. Please configure active sports in Sports Config first.
          </p>
        )}

        <Input
          id="dateKey"
          type="date"
          label="Session Date"
          value={dateKey}
          onChange={(e) => setDateKey(e.target.value)}
          required
        />

        <div className="pt-3 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <Link
            href="/coach"
            className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </Link>
          <Button
            type="submit"
            loading={loading}
            disabled={sports.length === 0}
            className="w-full sm:w-auto"
          >
            Open Practice Session
          </Button>
        </div>
      </form>
    </div>
  );
}
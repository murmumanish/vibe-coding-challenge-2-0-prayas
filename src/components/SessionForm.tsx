"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/Button";
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
  const [sportId] = useState(sports.length > 0 ? sports[0]._id : "");
  const [dateKey, setDateKey] = useState(getISTDateKey());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sportId || !dateKey) {
      setError("Please specify a session date.");
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

  return (
    <div className="rounded-2xl border border-card-border bg-card p-6 shadow-xs max-w-2xl transition-colors">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-card-border">
        <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary-container text-primary-on-container">
          <ClipboardIcon className="w-5 h-5" />
        </span>
        <div>
          <h2 className="text-base font-bold text-foreground">
            Daily Practice Session Details
          </h2>
          <p className="text-xs text-foreground opacity-70">
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
        {sports.length === 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            No active sports assigned. Please configure assigned sports in the Admin Section first.
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
            href="/coach/sessions"
            className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-foreground opacity-70 hover:opacity-100 hover:bg-card-hover transition"
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

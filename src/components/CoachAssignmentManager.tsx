"use client";

import { useState, useEffect } from "react";
import {
  WhistleIcon,
  SearchIcon,
  CloseIcon,
  SportsIcon,
  CheckIcon,
  AddIcon,
  MailIcon,
  CheckCircleIcon,
  AlertIcon,
  EyeIcon,
  EyeOffIcon,
} from "./Icons";

export interface SportItem {
  _id: string;
  name: string;
  slug?: string;
  isActive?: boolean;
}

export interface CoachItem {
  _id: string;
  name: string;
  email: string;
  role: "coach";
  isActive: boolean;
  assignedSports: SportItem[];
  createdAt?: string;
}

interface CoachAssignmentManagerProps {
  initialCoaches: CoachItem[];
  sports: SportItem[];
}

export function CoachAssignmentManager({
  initialCoaches,
  sports,
}: CoachAssignmentManagerProps) {
  const [coaches, setCoaches] = useState<CoachItem[]>(initialCoaches);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  // Assign Sports Modal State
  const [assigningCoach, setAssigningCoach] = useState<CoachItem | null>(null);
  const [selectedSportIds, setSelectedSportIds] = useState<string[]>([]);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [assignError, setAssignError] = useState("");

  // Add New Coach Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCoachName, setNewCoachName] = useState("");
  const [newCoachEmail, setNewCoachEmail] = useState("");
  const [newCoachPassword, setNewCoachPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newCoachSportIds, setNewCoachSportIds] = useState<string[]>([]);
  const [addingCoach, setAddingCoach] = useState(false);
  const [addError, setAddError] = useState("");

  // Dismiss toast notice after 4 seconds
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  // Open Assign Modal
  function handleOpenAssignModal(coach: CoachItem) {
    setAssigningCoach(coach);
    setSelectedSportIds((coach.assignedSports || []).map((s) => s._id));
    setAssignError("");
  }

  function handleToggleSportSelection(sportId: string) {
    setSelectedSportIds((prev) =>
      prev.includes(sportId) ? prev.filter((id) => id !== sportId) : [...prev, sportId]
    );
  }

  function handleSelectAll() {
    setSelectedSportIds(sports.map((s) => s._id));
  }

  function handleDeselectAll() {
    setSelectedSportIds([]);
  }

  async function handleSaveAssignment() {
    if (!assigningCoach) return;
    setSavingAssignment(true);
    setAssignError("");

    try {
      const res = await fetch(`/api/admin/coaches/${assigningCoach._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sportIds: selectedSportIds }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAssignError(data.error || "Failed to update assigned sports");
        return;
      }

      setCoaches((prev) =>
        prev.map((c) => (c._id === data.coach._id ? data.coach : c))
      );
      setNotice(`Sports successfully assigned to coach ${assigningCoach.name}!`);
      setAssigningCoach(null);
    } catch {
      setAssignError("Network error: failed to save sports assignment.");
    } finally {
      setSavingAssignment(false);
    }
  }

  // Create Coach
  async function handleCreateCoach(e: React.FormEvent) {
    e.preventDefault();
    if (!newCoachName.trim() || !newCoachEmail.trim()) {
      setAddError("Please provide both coach full name and login email.");
      return;
    }

    if (newCoachPassword.trim() && newCoachPassword.trim().length < 6) {
      setAddError("Password must be at least 6 characters long.");
      return;
    }

    setAddingCoach(true);
    setAddError("");

    try {
      const res = await fetch("/api/admin/coaches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCoachName.trim(),
          email: newCoachEmail.trim().toLowerCase(),
          password: newCoachPassword.trim() || "coach123",
          sportIds: newCoachSportIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || "Failed to create coach account");
        return;
      }

      // Re-fetch populated coach with sports
      const freshRes = await fetch("/api/admin/coaches");
      if (freshRes.ok) {
        const freshData = await freshRes.json();
        setCoaches(freshData.coaches);
      } else {
        setCoaches((prev) => [...prev, data.coach]);
      }

      setNotice(`Coach login account successfully created for ${newCoachName}!`);
      setShowAddModal(false);
      setNewCoachName("");
      setNewCoachEmail("");
      setNewCoachPassword("");
      setShowPassword(false);
      setNewCoachSportIds([]);
    } catch {
      setAddError("Network error: failed to create coach.");
    } finally {
      setAddingCoach(false);
    }
  }

  const filteredCoaches = coaches.filter(
    (coach) =>
      coach.name.toLowerCase().includes(search.toLowerCase()) ||
      coach.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Toast Notice */}
      {notice && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 p-3.5 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">{notice}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Action Bar: Search & Enroll Coach */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card p-3.5 sm:p-4 rounded-2xl border border-card-border shadow-xs transition-colors">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <SearchIcon className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search coaches by name or login email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-card-border bg-slate-50 dark:bg-slate-800/80 pl-10 pr-3.5 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-slate-400 transition-colors"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setShowAddModal(true);
            setAddError("");
            setShowPassword(false);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-primary text-primary-foreground hover:bg-primary-hover border border-card-border shadow-xs transition active:scale-[0.98] shrink-0"
        >
          <AddIcon className="w-4 h-4" />
          <span>Add New Coach</span>
        </button>
      </div>

      {/* Coaches Cards Grid */}
      {filteredCoaches.length === 0 ? (
        <div className="rounded-2xl border border-card-border bg-card p-10 text-center transition-colors">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-primary-container text-foreground flex items-center justify-center mb-3">
            <WhistleIcon className="w-6 h-6 text-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">No coaches found</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {coaches.length === 0
              ? "No coaching staff registered yet. Add your first coach to assign sports."
              : "No coaches match your search criteria."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCoaches.map((coach) => {
            const assignedList = coach.assignedSports || [];
            return (
              <div
                key={coach._id}
                className="rounded-2xl border border-card-border bg-card p-5 shadow-xs hover:border-primary transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Coach Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary-container text-foreground font-black text-base shadow-xs shrink-0">
                        {coach.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <h3
                          className="text-base font-bold text-foreground truncate"
                          title={coach.name}
                        >
                          {coach.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                          <MailIcon className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{coach.email}</span>
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0">
                      Coach
                    </span>
                  </div>

                  {/* Assigned Sports Section */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <SportsIcon className="w-3.5 h-3.5" />
                        Assigned Sports ({assignedList.length})
                      </span>
                    </div>

                    {assignedList.length === 0 ? (
                      <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs italic flex items-center gap-1.5">
                        <AlertIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>No sports assigned. Coach cannot conduct sessions.</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                        {assignedList.map((sport) => (
                          <span
                            key={sport._id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary-container text-foreground border border-card-border"
                          >
                            <SportsIcon className="w-3 h-3" />
                            <span>{sport.name}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {assignedList.length === 0
                      ? "Restricted access"
                      : "Authorized for " +
                        assignedList.length +
                        " sport" +
                        (assignedList.length === 1 ? "" : "s")}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenAssignModal(coach)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary-hover border border-card-border shadow-xs transition active:scale-[0.98]"
                  >
                    <SportsIcon className="w-3.5 h-3.5" />
                    <span>Assign Sports</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: Assign Sports to Coach ── */}
      {assigningCoach && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setAssigningCoach(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-card-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-card-border bg-slate-50 dark:bg-slate-800/50 flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary mb-1">
                  <WhistleIcon className="w-4 h-4" />
                  <span>Coach Sports Authority</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-foreground">
                  Assign Sports: {assigningCoach.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Check all sport disciplines this coach is authorized to conduct. The coach will only see and manage these sports.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAssigningCoach(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700 transition"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {assignError && (
              <div className="m-5 mb-0 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs flex items-center gap-2">
                <AlertIcon className="w-4 h-4 shrink-0" />
                <span>{assignError}</span>
              </div>
            )}

            {/* Modal Body: Sports Checkboxes */}
            <div className="p-5 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center justify-between text-xs pb-1">
                <span className="font-bold text-slate-500 dark:text-slate-400">
                  {selectedSportIds.length} of {sports.length} sports selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-primary hover:underline font-bold"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-slate-500 hover:underline font-bold"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {sports.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">
                  No active sports configured in the academy catalog. Please add sports in Sports Catalog first.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {sports.map((sport) => {
                    const isSelected = selectedSportIds.includes(sport._id);
                    return (
                      <label
                        key={sport._id}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all select-none ${
                          isSelected
                            ? "bg-primary-container text-foreground border-primary shadow-xs"
                            : "bg-slate-50 dark:bg-slate-800/40 border-card-border text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSportSelection(sport._id)}
                          className="h-4 w-4 rounded text-primary focus:ring-primary border-card-border"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold truncate">{sport.name}</p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                            Active Discipline
                          </span>
                        </div>
                        {isSelected && (
                          <CheckIcon className="w-4 h-4 text-primary shrink-0" />
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/40 border-t border-card-border flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setAssigningCoach(null)}
                className="py-2 px-4 rounded-xl text-xs font-bold border border-card-border text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveAssignment}
                disabled={savingAssignment}
                className="py-2 px-5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary-hover border border-card-border shadow-xs transition active:scale-[0.98] disabled:opacity-50"
              >
                {savingAssignment ? "Saving..." : "Save Assigned Sports"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Add New Coach ── */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-card-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleCreateCoach}>
              <div className="p-5 sm:p-6 border-b border-card-border bg-slate-50 dark:bg-slate-800/50 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-foreground">
                    Enroll New Coach
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Create coach login credentials and assign authorized sports disciplines.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700 transition"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>

              {addError && (
                <div className="m-5 mb-0 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs flex items-center gap-2">
                  <AlertIcon className="w-4 h-4 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              <div className="p-5 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Coach Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={newCoachName}
                    onChange={(e) => setNewCoachName(e.target.value)}
                    className="w-full rounded-xl border border-card-border bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Coach Login Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul.coach@academy.com"
                    value={newCoachEmail}
                    onChange={(e) => setNewCoachEmail(e.target.value)}
                    className="w-full rounded-xl border border-card-border bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Login Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 6 characters (leave blank for default: coach123)"
                      value={newCoachPassword}
                      onChange={(e) => setNewCoachPassword(e.target.value)}
                      className="w-full rounded-xl border border-card-border bg-slate-50 dark:bg-slate-800/80 pl-3.5 pr-10 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="w-4 h-4" />
                      ) : (
                        <EyeIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
                    Default password is <code className="font-mono font-bold text-foreground">coach123</code> if left empty.
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-foreground">
                      Assign Initial Sports
                    </label>
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setNewCoachSportIds(sports.map((s) => s._id))}
                        className="text-primary hover:underline font-bold text-[11px]"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <button
                        type="button"
                        onClick={() => setNewCoachSportIds([])}
                        className="text-slate-500 hover:underline font-bold text-[11px]"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                    {sports.map((sport) => {
                      const isChecked = newCoachSportIds.includes(sport._id);
                      return (
                        <label
                          key={sport._id}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer ${
                            isChecked
                              ? "bg-primary-container text-foreground border-primary font-bold"
                              : "bg-slate-50 dark:bg-slate-800/40 border-card-border text-foreground"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              setNewCoachSportIds((prev) =>
                                prev.includes(sport._id)
                                  ? prev.filter((id) => id !== sport._id)
                                  : [...prev, sport._id]
                              )
                            }
                            className="h-3.5 w-3.5 rounded text-primary border-card-border"
                          />
                          <span className="truncate">{sport.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/40 border-t border-card-border flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2 px-4 rounded-xl text-xs font-bold border border-card-border text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingCoach}
                  className="py-2 px-5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary-hover border border-card-border shadow-xs transition active:scale-[0.98] disabled:opacity-50"
                >
                  {addingCoach ? "Creating..." : "Create Coach Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

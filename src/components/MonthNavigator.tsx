"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import {
  getCurrentISTMonth,
  formatMonthTitle,
  getPrevMonth,
  getNextMonth,
  SHORT_MONTH_NAMES,
} from "@/lib/monthUtils";

export interface MonthNavigatorProps {
  month: string;
  onChange: (month: string) => void;
  minMonth?: string | null;
  maxMonth?: string;
  monthCounts?: Record<string, number>;
}

export function MonthNavigator({
  month,
  onChange,
  minMonth,
  maxMonth = getCurrentISTMonth(),
  monthCounts = {},
}: MonthNavigatorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Year state inside the picker dialog (initialized to current selected month's year)
  const currentMonthYear = parseInt(month.split("-")[0] || "2026", 10);
  const [pickerYear, setPickerYear] = useState<number>(currentMonthYear);

  // Keep pickerYear synced when month changes externally
  useEffect(() => {
    const y = parseInt(month.split("-")[0] || "2026", 10);
    setPickerYear(y);
  }, [month]);

  // Dialog container ref for outside click & escape handler
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }

    function handleMouseDown(e: MouseEvent) {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [isOpen]);

  const prevMonthStr = getPrevMonth(month);
  const isPrevDisabled = Boolean(minMonth && prevMonthStr < minMonth);

  const nextMonthStr = getNextMonth(month);
  const isNextDisabled = nextMonthStr > maxMonth;

  function handlePrev() {
    if (isPrevDisabled) return;
    onChange(prevMonthStr);
  }

  function handleNext() {
    if (isNextDisabled) return;
    onChange(nextMonthStr);
  }

  // Year navigation boundaries in popup
  const minYear = minMonth ? parseInt(minMonth.split("-")[0], 10) : pickerYear - 3;
  const maxYear = parseInt(maxMonth.split("-")[0], 10);

  const canPrevYear = pickerYear > minYear;
  const canNextYear = pickerYear < maxYear;

  return (
    <div className="relative flex sm:inline-flex items-center w-full sm:w-auto">
      {/* ── Main Navigator Bar (extends end-to-end on mobile) ── */}
      <div className="flex items-center justify-between gap-1 sm:gap-2 rounded-2xl border border-card-border bg-card p-1 shadow-xs transition-colors w-full sm:w-auto">
        {/* Previous Month Arrow */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={isPrevDisabled}
          aria-label="Previous month"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-foreground hover:bg-card-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Month Title (Tapping opens Year/Month picker) */}
        <button
          type="button"
          onClick={() => {
            setPickerYear(parseInt(month.split("-")[0] || "2026", 10));
            setIsOpen((prev) => !prev);
          }}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label={`Select month, currently ${formatMonthTitle(month)}`}
          className="min-h-[44px] px-3 sm:px-4 flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl text-xs sm:text-sm font-bold text-foreground hover:bg-card-hover transition-colors"
        >
          <Calendar className="w-4 h-4 text-primary shrink-0" />
          <span>{formatMonthTitle(month)}</span>
        </button>

        {/* Next Month Arrow */}
        <button
          type="button"
          onClick={handleNext}
          disabled={isNextDisabled}
          aria-label="Next month"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-foreground hover:bg-card-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* ── Single Popup Picker (Year arrows + 3x4 Jan..Dec Grid) ── */}
      {isOpen && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Select year and month"
          className="absolute top-full left-0 right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 mt-2 z-50 w-full sm:w-80 rounded-2xl border border-card-border bg-card p-4 shadow-xl animate-in fade-in zoom-in-95 transition-colors"
        >
          {/* Top Row: Year Switcher */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-card-border">
            <button
              type="button"
              onClick={() => setPickerYear((y) => y - 1)}
              disabled={!canPrevYear}
              aria-label="Previous year"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-foreground hover:bg-card-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-sm font-extrabold text-foreground tracking-wide">
              {pickerYear}
            </span>

            <button
              type="button"
              onClick={() => setPickerYear((y) => y + 1)}
              disabled={!canNextYear}
              aria-label="Next year"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-foreground hover:bg-card-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 3x4 Month Grid */}
          <div className="grid grid-cols-3 gap-2">
            {SHORT_MONTH_NAMES.map((shortName, idx) => {
              const mKey = `${pickerYear}-${String(idx + 1).padStart(2, "0")}`;
              const isSelected = mKey === month;
              const isFuture = mKey > maxMonth;
              const isBelowMin = Boolean(minMonth && mKey < minMonth);
              const isDisabled = isFuture || isBelowMin;
              const count = monthCounts[mKey] ?? 0;
              const hasCount = count > 0;

              return (
                <button
                  key={mKey}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    onChange(mKey);
                    setIsOpen(false);
                  }}
                  aria-label={`${shortName} ${pickerYear}${hasCount ? `, ${count} records` : ""}`}
                  className={`min-h-[44px] px-2 py-2 flex flex-col items-center justify-center rounded-xl text-xs transition-colors relative ${
                    isSelected
                      ? "bg-primary text-primary-foreground font-extrabold shadow-xs"
                      : isDisabled
                      ? "opacity-30 cursor-not-allowed text-foreground"
                      : !hasCount
                      ? "text-foreground opacity-60 hover:bg-card-hover hover:opacity-100"
                      : "text-foreground font-semibold hover:bg-card-hover"
                  }`}
                >
                  <span>{shortName}</span>
                  {hasCount && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold mt-0.5 ${
                        isSelected
                          ? "bg-primary-hover text-white"
                          : "bg-primary-container text-primary-on-container"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

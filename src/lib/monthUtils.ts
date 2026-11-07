// src/lib/monthUtils.ts
import { getISTDateKey } from "./utils";

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const SHORT_MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/**
 * Returns the current month in IST as "YYYY-MM".
 */
export function getCurrentISTMonth(): string {
  return getISTDateKey().slice(0, 7);
}

/**
 * Validates if the string matches "YYYY-MM" with valid month range 01-12.
 */
export function isValidMonthFormat(monthStr: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(monthStr);
}

/**
 * Checks if a given month is strictly in the future compared to current IST month.
 */
export function isFutureMonth(
  monthStr: string,
  currentMonth: string = getCurrentISTMonth()
): boolean {
  if (!isValidMonthFormat(monthStr)) return false;
  return monthStr > currentMonth;
}

/**
 * Formats "YYYY-MM" to "October 2026".
 */
export function formatMonthTitle(monthStr: string): string {
  if (!isValidMonthFormat(monthStr)) return monthStr;
  const [yearStr, monthNumStr] = monthStr.split("-");
  const monthIdx = parseInt(monthNumStr, 10) - 1;
  const name = MONTH_NAMES[monthIdx] || "";
  return `${name} ${yearStr}`;
}

/**
 * Formats "YYYY-MM" to "October".
 */
export function formatMonthName(monthStr: string): string {
  if (!isValidMonthFormat(monthStr)) return monthStr;
  const [, monthNumStr] = monthStr.split("-");
  const monthIdx = parseInt(monthNumStr, 10) - 1;
  return MONTH_NAMES[monthIdx] || monthStr;
}

/**
 * Returns previous month string "YYYY-MM" via string arithmetic.
 */
export function getPrevMonth(monthStr: string): string {
  if (!isValidMonthFormat(monthStr)) return monthStr;
  const [yearStr, monthNumStr] = monthStr.split("-");
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthNumStr, 10);

  if (month === 1) {
    year -= 1;
    month = 12;
  } else {
    month -= 1;
  }

  return `${year}-${String(month).padStart(2, "0")}`;
}

/**
 * Returns next month string "YYYY-MM" via string arithmetic.
 */
export function getNextMonth(monthStr: string): string {
  if (!isValidMonthFormat(monthStr)) return monthStr;
  const [yearStr, monthNumStr] = monthStr.split("-");
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthNumStr, 10);

  if (month === 12) {
    year += 1;
    month = 1;
  } else {
    month += 1;
  }

  return `${year}-${String(month).padStart(2, "0")}`;
}

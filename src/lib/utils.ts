// src/lib/utils.ts

/**
 * Returns today's date as an IST (UTC+5:30) string in YYYY-MM-DD format.
 * Used for dateKey fields to avoid timezone bugs in same-day checks.
 */
export function getISTDateKey(date: Date = new Date()): string {
  // IST is UTC + 5:30 = +330 minutes
  const IST_OFFSET = 330;
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60_000;
  const istDate = new Date(utcMs + IST_OFFSET * 60_000);

  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, "0");
  const day = String(istDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Formats a YYYY-MM-DD dateKey into a human-readable IST date.
 * Example: "2026-11-01" → "01 Nov 2026"
 */
export function formatISTDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${day} ${months[parseInt(month, 10) - 1]} ${year}`;
}

/**
 * Generates a URL-friendly slug from a string.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

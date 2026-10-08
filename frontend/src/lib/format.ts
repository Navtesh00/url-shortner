const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function truncateMiddle(value: string, maxLen: number): string {
  if (value.length <= maxLen) return value;
  const keep = Math.max(0, Math.floor((maxLen - 3) / 2));
  return `${value.slice(0, keep)}…${value.slice(value.length - keep)}`;
}

/** Deterministic absolute timestamp — used as the initial SSR-safe render. */
export function formatAbsolute(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "just now";
  return date.toLocaleString();
}

export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "just now";

  const diff = Date.now() - then;
  if (diff < 0) return "just now";
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < DAY * 7) return `${Math.floor(diff / DAY)}d ago`;

  return new Date(iso).toLocaleDateString();
}
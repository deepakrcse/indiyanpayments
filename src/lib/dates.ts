// Calendar dates travel as 'YYYY-MM-DD' (what the report APIs take) and are built from LOCAL
// parts, never from toISOString(): that converts to UTC and, in India (UTC+5:30), turns
// early-morning dates into the previous day.

const pad = (n: number) => String(n).padStart(2, '0');

export const toIso = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** 'YYYY-MM-DD' -> local midnight, or null if it is not a real date. */
export function fromIso(iso: string | null | undefined): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  if (!m) return null;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return toIso(date) === iso ? date : null;
}

export const todayIso = () => toIso(new Date());

export const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export interface QuickRange {
  key: string;
  label: string;
  range: (today: Date) => [Date, Date];
}

/** The ranges people reach for most. */
export const QUICK_RANGES: QuickRange[] = [
  { key: 'today', label: 'Today', range: (t) => [t, t] },
  { key: 'yesterday', label: 'Yesterday', range: (t) => [addDays(t, -1), addDays(t, -1)] },
  { key: 'last7', label: 'Last 7 days', range: (t) => [addDays(t, -6), t] },
  { key: 'last30', label: 'Last 30 days', range: (t) => [addDays(t, -29), t] },
  { key: 'thisMonth', label: 'This month', range: (t) => [new Date(t.getFullYear(), t.getMonth(), 1), t] },
  { key: 'lastMonth', label: 'Last month', range: (t) => [new Date(t.getFullYear(), t.getMonth() - 1, 1), new Date(t.getFullYear(), t.getMonth(), 0)] },
];

export function quickRange(key: string): { from: string; to: string } | null {
  const entry = QUICK_RANGES.find((q) => q.key === key);
  if (!entry) return null;
  const [from, to] = entry.range(new Date());
  return { from: toIso(from), to: toIso(to) };
}

/** Whole days from today to a due date; negative once it has passed. */
export function daysUntil(iso: string | null | undefined): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!m) return null;
  const due = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const now = new Date();
  return Math.round((due - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86_400_000);
}

/** Today's date as a heading: "Mon, 9 Nov 2026". */
export const todayLabel = () => new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

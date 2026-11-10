/** ₹2,19,318.80 — Indian digit grouping, always two decimals; negatives read −₹18,247.65. */
export function rupees(value: number | string | null | undefined, decimals = 2): string {
  const raw = Number(value ?? 0);
  const n = Number.isFinite(raw) ? raw : 0;
  const body = Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return `${n < 0 ? '−' : ''}₹${body}`;
}

/** ₹5.35L, ₹1.2Cr, ₹48.6K — for tight summary tiles; pair it with the full figure in a title. */
export function rupeesCompact(value: number | null | undefined): string {
  const n = Number(value ?? 0);
  const body = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 2 }).format(Math.abs(n));
  return `${n < 0 ? '−' : ''}₹${body}`;
}

/** The same, or a dash for a missing value. */
export const rupeesOrDash = (value: number | null | undefined) => (value == null ? '—' : rupees(value));

export const count = (n: number) => n.toLocaleString('en-IN');

/** "PERCENT" charges read as a percentage, anything else as a flat amount. */
export function formatCharge(type: string | null | undefined, value: number | null | undefined): string {
  if (value == null) return '—';
  return type === 'PERCENT' ? `${Number(value)}%` : rupees(value);
}

export function dateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Narrow enough for a PDF column: 18/09/26, 06:00 pm. */
export function compactDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/** "10 Nov 2026" — the date half of `dateTime`. */
export function dateOnly(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function timeOnly(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-10-10" -> "10 Oct 2026", read as a calendar date so no time zone shifts the day. */
export function calendarDate(iso: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!m) return iso ?? '—';
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

/** "2026-10-31T00:00:00" -> "31/10/2026". */
export function dayMonthYear(iso: string | null | undefined): string {
  const [y, m, d] = String(iso ?? '').slice(0, 10).split('-');
  return y && m && d ? `${d}/${m}/${y}` : '—';
}

/** Two-letter initials from a name, "?" when empty. */
export function initials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const firstName = (name: string | null | undefined) => (name ?? '').trim().split(/\s+/)[0] || 'there';

export const plural = (n: number, one: string, many = `${one}s`) => `${count(n)} ${n === 1 ? one : many}`;

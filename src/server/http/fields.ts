import 'server-only';

type Json = unknown;

/**
 * Case-insensitive reader for remote rows. The remote's field names follow no single
 * convention ("FULL_NAME", "currentBalance", "QrId", "UTR"…), and some endpoints have
 * returned the same field in different casings — so every read names the field once and
 * matches it regardless of case, the way the remote's own serializer reads requests.
 */
export class Fields {
  private readonly map = new Map<string, Json>();

  constructor(raw: Json) {
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      for (const [k, v] of Object.entries(raw as Record<string, Json>)) {
        const key = k.toLowerCase();
        // The first non-null spelling wins if a row carries two.
        if (!this.map.has(key) || this.map.get(key) == null) this.map.set(key, v);
      }
    }
  }

  raw(...names: string[]): Json {
    for (const n of names) {
      const v = this.map.get(n.toLowerCase());
      if (v !== undefined && v !== null) return v;
    }
    return undefined;
  }

  has(...names: string[]): boolean {
    return this.raw(...names) !== undefined;
  }

  /** Text, or null when absent or blank. */
  str(...names: string[]): string | null {
    const v = this.raw(...names);
    if (v === undefined) return null;
    const s = typeof v === 'string' ? v : typeof v === 'number' || typeof v === 'boolean' ? String(v) : null;
    return s !== null && s.trim() !== '' ? s : null;
  }

  /** Text, or '' when absent. */
  text(...names: string[]): string {
    return this.str(...names) ?? '';
  }

  /** A number, reading numeric strings ("98.2") leniently; null when absent or not a number. */
  num(...names: string[]): number | null {
    const v = this.raw(...names);
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v.replace(/,/g, ''));
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }

  /** A number, or 0 when absent. */
  amount(...names: string[]): number {
    return this.num(...names) ?? 0;
  }

  int(...names: string[]): number {
    return Math.trunc(this.num(...names) ?? 0);
  }

  bool(...names: string[]): boolean | null {
    const v = this.raw(...names);
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0;
    if (typeof v === 'string') {
      if (/^(true|1|yes)$/i.test(v)) return true;
      if (/^(false|0|no)$/i.test(v)) return false;
    }
    return null;
  }

  list(...names: string[]): Json[] {
    const v = this.raw(...names);
    return Array.isArray(v) ? v : [];
  }
}

export const fields = (raw: Json) => new Fields(raw);

/** The rows of a list payload, tolerating a single object where a list was expected. */
export function rowsOf(data: Json): Json[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') return [data];
  return [];
}

/** Several remote reads return one record as a single-element array. */
export function firstOf(data: Json): Json | null {
  if (Array.isArray(data)) return data.length > 0 ? data[0] : null;
  return data && typeof data === 'object' ? data : null;
}

/** "2026-10-31T00:00:00" or "2026-10-31" -> "2026-10-31". */
export function dateOnly(v: string | null): string {
  return v ? v.slice(0, 10) : '';
}

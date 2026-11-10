import 'server-only';

interface Entry {
  value: unknown;
  expiresAt: number;
}

const MAX_ENTRIES = 50_000;

/**
 * Process-wide TTL cache. Kept on globalThis so dev-server reloads do not drop it.
 * It holds short-lived state that must survive between two requests: fetched bills awaiting
 * payment, payment-return tokens, the wallet-owner directory, the biller list.
 */
class MemoryCache {
  private readonly store = new Map<string, Entry>();

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  set(key: string, value: unknown, ttlMs: number): void {
    if (this.store.size >= MAX_ENTRIES) this.sweep();
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  private sweep(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) if (now >= entry.expiresAt) this.store.delete(key);
    // Still full: drop the oldest insertions.
    const excess = this.store.size - MAX_ENTRIES + 1000;
    if (excess > 0) [...this.store.keys()].slice(0, excess).forEach((k) => this.store.delete(k));
  }
}

const globalForCache = globalThis as unknown as { __ipCache?: MemoryCache; __ipLocks?: Set<string> };

export const cache = (globalForCache.__ipCache ??= new MemoryCache());

const locks = (globalForCache.__ipLocks ??= new Set<string>());

/**
 * Runs `work` unless the same key is already in flight — a double click must not pay,
 * refund or pull back twice. Returns `null` when the key was busy.
 */
export async function once<T>(key: string, work: () => Promise<T>): Promise<{ busy: true } | { busy: false; result: T }> {
  if (locks.has(key)) return { busy: true };
  locks.add(key);
  try {
    return { busy: false, result: await work() };
  } finally {
    locks.delete(key);
  }
}

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;

import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { env } from '@/server/config/env';

interface Entry {
  walletId: number;
  qrId: number;
  utr: string;
  amount: number;
  remarks: string;
  savedAt: string;
}

const MAX_ENTRIES = 20_000;

/**
 * The note a retailer types when creating a QR collect request. The remote's create call does not
 * keep it (its "remarks" only ever carries an admin's rejection reason), so it is kept here in a
 * small JSON file and matched back by wallet, QR, UTR and amount. Writes go to a temporary file
 * that is then swapped in, so a crash part-way never leaves a half-written file.
 */
class QrRemarkStore {
  private entries: Entry[] | null = null;
  private writing: Promise<void> = Promise.resolve();

  private get file() {
    return path.resolve(env().STORAGE_PATH, 'qr-remarks.json');
  }

  private async load(): Promise<Entry[]> {
    if (this.entries) return this.entries;
    try {
      const parsed = JSON.parse(await fs.readFile(this.file, 'utf8'));
      this.entries = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') console.warn(`[qr-remarks] could not read ${this.file}; starting empty`, err);
      this.entries = [];
    }
    return this.entries;
  }

  async add(walletId: number, qrId: number, utr: string, amount: number, remarks: string) {
    const entries = await this.load();
    entries.push({ walletId, qrId, utr: utr.trim(), amount, remarks: remarks.trim(), savedAt: new Date().toISOString() });
    if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
    // Serialised so two saves never interleave. A failure is logged: the request itself already exists.
    this.writing = this.writing.then(async () => {
      try {
        await fs.mkdir(path.dirname(this.file), { recursive: true });
        const temp = `${this.file}.tmp`;
        await fs.writeFile(temp, JSON.stringify(entries));
        await fs.rename(temp, this.file);
      } catch (err) {
        console.warn(`[qr-remarks] could not save to ${this.file}`, err);
      }
    });
    await this.writing;
  }

  /** The most recent note for a request with this wallet, QR, UTR and amount. */
  async find(walletId: number, qrId: number, utr: string, amount: number): Promise<string | null> {
    const entries = await this.load();
    const needle = utr.trim().toLowerCase();
    for (let i = entries.length - 1; i >= 0; i -= 1) {
      const e = entries[i];
      if (e.walletId === walletId && e.qrId === qrId && e.amount === amount && e.utr.toLowerCase() === needle) return e.remarks;
    }
    return null;
  }
}

const globalForStore = globalThis as unknown as { __ipQrRemarks?: QrRemarkStore };
export const qrRemarkStore = (globalForStore.__ipQrRemarks ??= new QrRemarkStore());

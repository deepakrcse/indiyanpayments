import 'server-only';
import { masterClientId } from '@/server/config/env';
import { cache, MINUTE } from '@/server/cache/memory-cache';
import { firstOf, rowsOf } from '@/server/http/fields';
import { remotePost } from '@/server/http/remote-api';
import { roleFromName } from '@/server/auth/session';
import { toCustomer } from '@/server/mappers/customer.mapper';
import { toWallet } from '@/server/mappers/wallet.mapper';
import type { RetailerOption } from '@/types/customer';
import type { Role } from '@/types/auth';

export interface WalletOwner {
  customerId: number;
  walletId: number;
  name: string;
  mobile: string;
  store: string;
  roleName: string;
  role: Role;
}

const CACHE_KEY = 'wallet-owners:v1';

/**
 * Wallet → owner directory. Several remote reports (IMPS, QR requests, card bills) name only a
 * walletId, and none carries the shop name. There is no "every wallet" endpoint, so it is built
 * from every customer and then each one's wallet — one remote call per customer — and kept for
 * ten minutes. Only the master client's customers are read.
 */
async function build(): Promise<WalletOwner[]> {
  const customers = rowsOf((await remotePost('customer/SelectByClientId', { client_ID: masterClientId() })).data)
    .map(toCustomer)
    .filter((c) => c.hasWallet);

  const owners = await Promise.all(
    customers.map(async (c) => {
      const row = firstOf((await remotePost('wallet/SelectByCustomerId', { client_ID: masterClientId(), customerId: c.id })).data);
      if (!row) return null;
      const name = c.fullName.trim() || c.storeName.trim();
      if (!name) return null;
      return {
        customerId: c.id,
        walletId: toWallet(row).walletId,
        name,
        mobile: c.mobileNumber,
        store: c.storeName,
        roleName: c.roleName,
        role: roleFromName(c.roleName),
      } satisfies WalletOwner;
    }),
  );
  return owners.filter((o): o is WalletOwner => o !== null && o.walletId > 0);
}

export async function walletOwners(fresh = false): Promise<Map<number, WalletOwner>> {
  if (!fresh) {
    const hit = cache.get<WalletOwner[]>(CACHE_KEY);
    if (hit) return new Map(hit.map((o) => [o.walletId, o]));
  }
  const list = await build();
  // An empty answer is a failed lookup, not "no retailers" — so it is not kept.
  if (list.length > 0) cache.set(CACHE_KEY, list, 10 * MINUTE);
  return new Map(list.map((o) => [o.walletId, o]));
}

/** Reads the directory, and once more fresh if any wallet asked about is unknown (created in the last minutes). */
export async function ownersIncluding(...walletIds: number[]): Promise<Map<number, WalletOwner>> {
  const owners = await walletOwners();
  return walletIds.every((id) => owners.has(id)) ? owners : walletOwners(true);
}

/**
 * Everyone with a wallet, for the retailer pickers. Distributors are listed on their own
 * (Admin › Distributors), not among the retailers a screen picks from. Always read fresh, so a
 * wallet added a moment ago can be picked straight away (and the directory is refreshed with it).
 */
export async function listRetailers(): Promise<RetailerOption[]> {
  const owners = await walletOwners(true);
  return [...owners.values()]
    .filter((o) => o.role !== 'distributor')
    .map((o) => ({ customerId: o.customerId, walletId: o.walletId, fullName: o.name, storeName: o.store, roleName: o.roleName }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

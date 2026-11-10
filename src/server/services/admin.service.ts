import 'server-only';
import { masterClientId } from '@/server/config/env';
import { once } from '@/server/cache/memory-cache';
import { badGateway, badRequest, conflict, unprocessable } from '@/server/http/errors';
import { rowsOf } from '@/server/http/fields';
import { remotePost } from '@/server/http/remote-api';
import { toCustomerBusinessRow } from '@/server/mappers/admin.mapper';
import { toAdminImpsRow } from '@/server/mappers/imps.mapper';
import type { AdminImpsRow, CustomerBusinessRow } from '@/types/admin';
import { ownersIncluding, walletOwners } from './wallet-owners.service';

/**
 * Every retailer's IMPS transfers, client-wide. The remote names no retailer (customerName is
 * null) — only a walletId — so the owner, their mobile and their shop are filled in here.
 */
export async function adminImpsReport(fromDate: string, toDate: string): Promise<AdminImpsRow[]> {
  const result = await remotePost('Admin/ImpsTransferReport', { client_ID: masterClientId(), fromDate, toDate });
  if (!result.ok) throw badGateway(result.message);
  const rows = rowsOf(result.data).map(toAdminImpsRow);
  if (rows.length === 0) return rows;

  const owners = await walletOwners();
  return rows.map((row) => {
    const owner = owners.get(row.walletId);
    if (!owner) return row;
    return { ...row, customerName: row.customerName || owner.name, retailerMobile: owner.mobile, storeName: owner.store };
  });
}

/** One row per customer per day: what they did through PG, IMPS and card bills. Every wallet (0). */
export async function customerBusiness(fromDate: string, toDate: string): Promise<CustomerBusinessRow[]> {
  const result = await remotePost('Dashboard/CustomerBusiness', { client_ID: masterClientId(), fromDate, toDate, walletId: 0 });
  if (!result.ok) throw badGateway(result.message);
  return rowsOf(result.data).map(toCustomerBusinessRow);
}

/**
 * Refunds one transaction back to its wallet, whatever its status — the remote decides whether it
 * can be refunded and says why not.
 */
export async function refundTransaction(id: number, remarks?: string) {
  const run = await once(`refund:${id}`, async () => {
    const result = await remotePost('Transaction/Refund', { id, client_ID: masterClientId(), remarks: remarks?.trim() || 'Refunded by admin' });
    if (!result.ok) throw unprocessable(result.message, 'The refund did not go through.');
    return { message: result.message || 'Refund successful.', id };
  });
  if (run.busy) throw conflict('This refund is already being processed.');
  return run.result;
}

/**
 * Pulls money back from a retailer's wallet into the signed-in admin's own wallet. Both wallets
 * must belong to the master client; the source must not be an admin's and the target must be.
 */
export async function pullback(adminWalletId: number, walletId: number, amount: number, remarks?: string) {
  if (walletId === adminWalletId) throw badRequest('A wallet cannot be pulled back into itself.');

  const owners = await ownersIncluding(walletId, adminWalletId);
  const from = owners.get(walletId);
  const to = owners.get(adminWalletId);
  if (!from || !to) throw badRequest('Unknown wallet.');
  if (to.role !== 'admin' || from.role === 'admin') throw badRequest("Money can only be pulled back from a retailer into an admin's wallet.");

  const run = await once(`pullback:${walletId}`, async () => {
    const result = await remotePost('Admin/Wallet/Pullback', {
      walletId,
      adminWalletId,
      client_ID: masterClientId(),
      amount,
      remarks: remarks?.trim() || 'Admin pullback',
    });
    if (!result.ok) throw unprocessable(result.message, 'The pullback did not go through.');
    return { message: result.message || 'Pullback successful.', amount };
  });
  if (run.busy) throw conflict('A pullback from this wallet is already being processed.');
  return run.result;
}

import 'server-only';
import { masterClientId } from '@/server/config/env';
import { badGateway, badRequest, conflict, unprocessable } from '@/server/http/errors';
import { rowsOf } from '@/server/http/fields';
import { remotePost } from '@/server/http/remote-api';
import { toMappedRetailer } from '@/server/mappers/customer.mapper';
import type { MappedRetailer } from '@/types/customer';
import { getWallet } from './wallet.service';
import { ownersIncluding } from './wallet-owners.service';

async function selectMapped(distributorWalletId: number): Promise<MappedRetailer[]> {
  const result = await remotePost('Distributor/Mapping/SelectRetailers', { client_ID: masterClientId(), distributorWalletId });
  if (!result.ok) throw badGateway(result.message);
  return rowsOf(result.data).map(toMappedRetailer);
}

/** The retailers mapped to a distributor. The distributor's wallet is found from their customer id. */
export async function mappedRetailers(distributorCustomerId: number): Promise<MappedRetailer[]> {
  const wallet = await getWallet(distributorCustomerId);
  return selectMapped(wallet.walletId);
}

/**
 * Maps a retailer to a distributor with the PG commission the distributor earns on it. Only a
 * retailer of the master client can be mapped, only to a distributor, and never twice.
 */
export async function mapRetailer(distributorCustomerId: number, retailerWalletId: number, pgCommissionPercent: number) {
  const distributorWallet = await getWallet(distributorCustomerId);
  const owners = await ownersIncluding(distributorWallet.walletId, retailerWalletId);

  if (owners.get(distributorWallet.walletId)?.role !== 'distributor') throw badRequest('Retailers can only be mapped to a distributor.');
  if (owners.get(retailerWalletId)?.role !== 'retailer') throw badRequest('Only a retailer can be mapped.');

  const existing = await selectMapped(distributorWallet.walletId);
  if (existing.some((m) => m.retailerWalletId === retailerWalletId)) throw conflict('This retailer is already mapped to this distributor.');

  const result = await remotePost('Distributor/Mapping/Save', {
    client_ID: masterClientId(),
    retailerWalletId,
    distributorWalletId: distributorWallet.walletId,
    pgCommissionPercent,
    isActive: true,
  });
  if (!result.ok) throw unprocessable(result.message, 'The retailer could not be mapped.');
  return { message: result.message || 'Retailer mapped.' };
}

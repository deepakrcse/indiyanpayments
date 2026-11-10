import 'server-only';
import { masterClientId } from '@/server/config/env';
import { badGateway, badRequest, conflict, notFound, unprocessable } from '@/server/http/errors';
import { firstOf } from '@/server/http/fields';
import { remotePost } from '@/server/http/remote-api';
import { toWallet, toWalletCredentials, type WalletCredentials } from '@/server/mappers/wallet.mapper';
import type { Customer } from '@/types/customer';
import type { Wallet } from '@/types/wallet';
import { getOwnedCustomer } from './customer.service';

async function selectWalletRow(customerId: number): Promise<unknown | null> {
  const result = await remotePost('wallet/SelectByCustomerId', { client_ID: masterClientId(), customerId });
  return result.ok ? firstOf(result.data) : null;
}

export async function findWallet(customerId: number): Promise<Wallet | null> {
  const row = await selectWalletRow(customerId);
  return row ? toWallet(row) : null;
}

export async function getWallet(customerId: number): Promise<Wallet> {
  const wallet = await findWallet(customerId);
  if (!wallet) throw notFound('No wallet is linked to this account.');
  return wallet;
}

/** Includes the wallet's own login — only ever used server-side to re-authenticate a transfer. */
export async function getWalletCredentials(customerId: number): Promise<WalletCredentials> {
  const row = await selectWalletRow(customerId);
  if (!row) throw badGateway(null, 'No wallet found for this account.');
  return toWalletCredentials(row);
}

/** Provisions a wallet for a customer that has none yet (their username is still empty). */
export async function provisionWallet(customerId: number): Promise<Customer> {
  const customer = await getOwnedCustomer(customerId);
  if (customer.hasWallet) throw conflict('This customer already has a wallet.');
  const result = await remotePost('wallet/Add', { customerId });
  if (!result.ok) throw badGateway(result.message, 'The wallet could not be added.');
  return getOwnedCustomer(customerId);
}

export async function updatePayoutCharges(customerId: number, payoutCharges: number): Promise<Wallet> {
  const wallet = await getWallet(customerId);
  const result = await remotePost('wallet/UpdatePayoutCharges', { client_ID: masterClientId(), walletId: wallet.walletId, payoutCharges });
  if (!result.ok) throw badGateway(result.message, 'The payout charge could not be updated.');
  return getWallet(customerId);
}

export async function addCredit(customerId: number, amount: number): Promise<Wallet> {
  const wallet = await getWallet(customerId);
  const result = await remotePost('Wallet/Credit', { client_ID: masterClientId(), walletId: wallet.walletId, amount, remarks: 'Manual topup' });
  if (!result.ok) throw badGateway(result.message, 'The credit could not be added.');
  return getWallet(customerId);
}

/** Moves balance from the signed-in admin's own wallet to another wallet. */
export async function transferFromWallet(fromCustomerId: number, toWalletId: number, amount: number) {
  const from = await getWallet(fromCustomerId);
  if (toWalletId === from.walletId) throw badRequest('A wallet cannot transfer to itself.');
  if (amount > from.currentBalance) throw badRequest('Insufficient balance.');
  const result = await remotePost<number>('Wallet/Transfer', {
    client_ID: masterClientId(),
    fromWalletId: from.walletId,
    toWalletId,
    amount,
    remarks: 'Wallet Transfer',
  });
  if (!result.ok) throw badGateway(result.message, 'The transfer did not go through.');
  return { message: 'Transfer completed.', transferId: result.data };
}

/**
 * Changes the wallet's login password and PIN in one call — the remote checks the old pair
 * itself and answers a wrong one in its message. To change one, send the other unchanged.
 */
export async function changeCredentials(
  customerId: number,
  input: { oldPassword: string; oldPasspin: string; newPassword: string; newPasspin: string },
) {
  const wallet = await getWallet(customerId);
  const result = await remotePost('Wallet/ChangePasswordPin', { client_ID: masterClientId(), walletId: wallet.walletId, ...input });
  if (!result.ok) throw unprocessable(result.message, 'The password or PIN could not be changed.');
  return { message: result.message || 'Updated.' };
}

/** Admin: sets a new password and/or PIN without the old ones. Only what is sent changes. */
export async function resetCredentials(customerId: number, newPassword: string | null, newPin: string | null) {
  const wallet = await getWallet(customerId);
  const body: Record<string, unknown> = { walletId: wallet.walletId, Client_ID: masterClientId() };
  if (newPassword) body.Password = newPassword;
  if (newPin) body.Passpin = newPin;
  const result = await remotePost('Admin/Wallet/ResetPassword', body);
  if (!result.ok) throw unprocessable(result.message, 'The password could not be reset.');
  const what = newPassword && newPin ? 'password and PIN' : newPassword ? 'password' : 'PIN';
  return { message: `The ${what} was reset.` };
}

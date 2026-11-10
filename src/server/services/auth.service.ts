import 'server-only';
import { masterClientId } from '@/server/config/env';
import { unauthorized } from '@/server/http/errors';
import { fields, firstOf } from '@/server/http/fields';
import { remotePost } from '@/server/http/remote-api';
import { roleFromName } from '@/server/auth/session';
import type { SessionUser } from '@/types/auth';
import { findWallet } from './wallet.service';

/**
 * wallet/Login answers a single-element array with most customer fields, under its own names
 * (the customer's id is "customerId" here, not "Id"). Its walletId is 0 for most accounts —
 * the customer record does not carry it — so the real wallet is resolved once here and kept
 * in the session for every page that works with a wallet.
 */
export async function login(username: string, password: string): Promise<SessionUser> {
  const result = await remotePost('wallet/Login', { username, password, client_ID: masterClientId() });
  const row = firstOf(result.data);
  if (!result.ok || !row) throw unauthorized(result.message || 'Invalid login ID or password.');

  const f = fields(row);
  const customerId = f.int('customerId');
  if (customerId <= 0) throw unauthorized('Invalid login ID or password.');

  let walletId = f.int('walletId');
  let balance = f.amount('lastBalance');
  let payoutCharges = f.amount('payoutCharges');
  if (walletId <= 0) {
    const wallet = await findWallet(customerId);
    if (wallet) {
      walletId = wallet.walletId;
      balance = wallet.currentBalance;
      payoutCharges = payoutCharges || wallet.payoutCharges;
    }
  }

  const roleName = (f.str('roleName') ?? '').trim();
  return {
    customerId,
    walletId,
    fullName: f.text('FULL_NAME'),
    storeName: f.text('STORE_NAME'),
    mobileNumber: f.text('MOBILE_NUMBER'),
    email: f.text('EMAIL_ID'),
    username: f.text('username') || username,
    roleId: f.num('roleId'),
    roleName,
    role: roleFromName(roleName),
    payoutCharges,
    balanceAtLogin: balance,
  };
}

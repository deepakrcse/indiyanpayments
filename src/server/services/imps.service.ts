import 'server-only';
import { masterClientId } from '@/server/config/env';
import { badGateway, badRequest, notFound } from '@/server/http/errors';
import { firstOf, rowsOf, fields } from '@/server/http/fields';
import { remotePost } from '@/server/http/remote-api';
import { oneRowPerAccount, toBank, toBankAccount, toImpsTransfer, toSender } from '@/server/mappers/imps.mapper';
import { toLedgerEntry } from '@/server/mappers/wallet.mapper';
import { isoDateInZone } from '@/server/time';
import type { Bank, BankAccount, BankVerification, ImpsTransfer, Sender } from '@/types/imps';
import type { LedgerEntry } from '@/types/wallet';
import { listCustomers } from './customer.service';
import { getWalletCredentials } from './wallet.service';

// ── Senders ───────────────────────────────────────────────────────────────

export async function findSender(mobileNumber: string): Promise<Sender | null> {
  const result = await remotePost('sender/SelectByMobileAndClientId', { client_ID: masterClientId(), mobileNumber });
  const row = result.ok ? firstOf(result.data) : null;
  return row ? toSender(row) : null;
}

export async function registerSender(input: {
  mobileNumber: string;
  senderName: string;
  senderAddress?: string | null;
  senderPan?: string | null;
  senderAadhaar?: string | null;
}): Promise<Sender> {
  const result = await remotePost('sender/Insert', {
    id: 0,
    Client_ID: masterClientId(),
    mobileNumber: input.mobileNumber,
    SenderName: input.senderName,
    // The remote columns are NOT NULL: an omitted value travels as "".
    SenderAddress: input.senderAddress ?? '',
    senderPan: input.senderPan ?? '',
    senderAadhaar: input.senderAadhaar ?? '',
  });
  if (!result.ok) throw badGateway(result.message, 'The sender could not be registered.');
  const sender = await findSender(input.mobileNumber);
  if (!sender) throw notFound('The sender was registered but could not be read back.');
  return sender;
}

// ── Banks & accounts ──────────────────────────────────────────────────────

export async function listBanks(): Promise<Bank[]> {
  const result = await remotePost('Bank/Select', {});
  return rowsOf(result.data).map(toBank);
}

/** A mobile number can have several accounts; every one is returned. */
export async function accountsForMobile(mobileNumber: string): Promise<BankAccount[]> {
  const result = await remotePost('BankAccount/SelectByMobileAndClientId', { client_ID: masterClientId(), mobileNumber });
  if (!result.ok) return [];
  return oneRowPerAccount(rowsOf(result.data).map(toBankAccount));
}

/** The remote refuses an account whose mobile has no sender yet — the sender is registered first. */
export async function addBankAccount(input: {
  mobileNumber: string;
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
}): Promise<BankAccount[]> {
  const result = await remotePost('BankAccount/Insert', {
    id: 0,
    Client_ID: masterClientId(),
    mobileNumber: input.mobileNumber,
    AccountHolderName: input.accountHolderName,
    AccountNumber: input.accountNumber,
    IFSC: input.ifsc,
    BankName: input.bankName,
    BankLogoUrl: null,
  });
  if (!result.ok) throw badGateway(result.message, 'The bank account could not be added.');
  return accountsForMobile(input.mobileNumber);
}

/**
 * There is no endpoint listing every account on the client — only per-mobile lookup — so this
 * walks every customer's mobile number.
 */
export async function allBankAccounts(): Promise<BankAccount[]> {
  const customers = await listCustomers();
  const lists = await Promise.all(customers.filter((c) => c.mobileNumber).map((c) => accountsForMobile(c.mobileNumber)));
  return oneRowPerAccount(lists.flat());
}

/**
 * Penny-drop verification: confirms an account + IFSC pair and returns the holder's name. It is
 * charged to the caller's own wallet, which is why the wallet comes from the session.
 */
export async function verifyBankAccount(walletId: number, accountNumber: string, ifsc: string): Promise<BankVerification> {
  const result = await remotePost('BankAccount/Verify', { client_ID: masterClientId(), walletId, accountNumber, ifsc });
  const f = fields(result.data);
  // "AccountVarifiedname" is the remote's actual (misspelled) field name.
  const verifiedName = f.str('AccountVarifiedname', 'AccountVerifiedName');
  if (!result.ok || !verifiedName) throw notFound(result.message || 'Could not verify this account.');
  return { accountNumber: f.text('AccountNumber') || accountNumber, ifsc: f.text('IFSC') || ifsc, verifiedName };
}

// ── Transfers & reports ───────────────────────────────────────────────────

export async function sendImps(
  customerId: number,
  input: { senderId: number; bankAccountId: number; amount: number; pin: string },
) {
  const wallet = await getWalletCredentials(customerId);
  if (input.amount > wallet.currentBalance) throw badRequest('Insufficient balance.');

  const result = await remotePost<number>('Transaction/Insert', {
    client_ID: masterClientId(),
    walletId: wallet.walletId,
    senderId: input.senderId,
    bankAccountId: input.bankAccountId,
    amount: input.amount,
    username: wallet.username,
    password: wallet.password,
    passpin: input.pin,
  });
  if (!result.ok) throw badGateway(result.message, 'The transfer did not go through.');
  return { message: 'Transfer submitted.', transactionId: result.data };
}

export async function transferReport(walletId: number, fromDate: string, toDate: string): Promise<ImpsTransfer[]> {
  const result = await remotePost('Transaction/Report', { client_ID: masterClientId(), walletId, fromDate, toDate });
  return rowsOf(result.data).map(toImpsTransfer);
}

/** Always today, in the portal's time zone. */
export function todaysTransfers(walletId: number) {
  const today = isoDateInZone();
  return transferReport(walletId, today, today);
}

export async function walletLedger(walletId: number, fromDate: string, toDate: string): Promise<LedgerEntry[]> {
  const result = await remotePost('Wallet/Ledger', { client_ID: masterClientId(), walletId, fromDate, toDate });
  return rowsOf(result.data).map(toLedgerEntry);
}

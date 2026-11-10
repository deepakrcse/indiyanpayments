import 'server-only';
import { fields } from '@/server/http/fields';
import type { LedgerEntry, Wallet } from '@/types/wallet';

/**
 * wallet/SelectByCustomerId also carries the wallet's login password and PIN in plain text.
 * They are deliberately not mapped, so they can never travel back out through this API.
 */
export function toWallet(raw: unknown): Wallet {
  const f = fields(raw);
  return {
    walletId: f.int('Id'),
    customerId: f.int('customerId'),
    currentBalance: f.amount('currentBalance'),
    payoutCharges: f.amount('payoutCharges'),
    isActive: f.bool('isActive') ?? false,
  };
}

/** The credentials Transaction/Insert re-authenticates with. Server-internal only. */
export interface WalletCredentials {
  walletId: number;
  username: string;
  password: string;
  currentBalance: number;
}

export function toWalletCredentials(raw: unknown): WalletCredentials {
  const f = fields(raw);
  return {
    walletId: f.int('Id'),
    username: f.text('username'),
    password: f.text('Password'),
    currentBalance: f.amount('currentBalance'),
  };
}

export function toLedgerEntry(raw: unknown): LedgerEntry {
  const f = fields(raw);
  return {
    id: f.int('Id'),
    createdTime: f.text('createdTime'),
    txnType: f.text('txnType'),
    channel: f.text('channel'),
    status: f.text('status'),
    remarks: f.text('remarks'),
    utr: f.str('utr'),
    senderName: f.str('senderName'),
    senderMobile: f.str('senderMobile'),
    accountHolderName: f.str('accountHolderName'),
    accountNumber: f.str('accountNumber'),
    ifsc: f.str('ifsc'),
    debit: f.amount('debit'),
    credit: f.amount('credit'),
    charges: f.amount('charges'),
    balance: f.amount('balance'),
  };
}

import 'server-only';
import { fields } from '@/server/http/fields';
import type { AdminImpsRow } from '@/types/admin';
import type { Bank, BankAccount, ImpsTransfer, Sender } from '@/types/imps';

export function toSender(raw: unknown): Sender {
  const f = fields(raw);
  return {
    id: f.int('Id'),
    mobileNumber: f.text('mobileNumber'),
    senderName: f.text('SenderName'),
    senderAddress: f.text('SenderAddress'),
    senderPan: f.text('senderPan'),
    senderAadhaar: f.text('senderAadhaar'),
  };
}

export function toBank(raw: unknown): Bank {
  const f = fields(raw);
  // The upstream calls the IFSC "IFSC_Code"; read as "IFSC" it came through empty for every bank.
  return { bankCode: f.text('BankCode'), bankName: f.text('BankName'), ifsc: f.text('IFSC_Code', 'IFSC') };
}

export function toBankAccount(raw: unknown): BankAccount {
  const f = fields(raw);
  return {
    id: f.int('Id'),
    mobileNumber: f.text('mobileNumber'),
    accountHolderName: f.text('AccountHolderName'),
    accountNumber: f.text('AccountNumber'),
    ifsc: f.text('IFSC'),
    bankName: f.text('BankName'),
    bankLogoUrl: f.str('BankLogoUrl'),
  };
}

/**
 * The remote has no bank name on a saved account: it matches the IFSC against its bank list,
 * and several banks share one IFSC (State Bank of India, of Mysore, of Patiala… all SBIN0000001).
 * So one account comes back once per match. One row per account is kept, preferring the name
 * that ends in the IFSC's own bank code ("State Bank of India - SBIN").
 */
export function oneRowPerAccount(rows: BankAccount[]): BankAccount[] {
  const byId = new Map<number, BankAccount[]>();
  for (const row of rows) byId.set(row.id, [...(byId.get(row.id) ?? []), row]);
  return [...byId.values()].map((group) => {
    const code = group[0].ifsc.length >= 4 ? group[0].ifsc.slice(0, 4).toLowerCase() : '';
    return group.find((a) => code && a.bankName.toLowerCase().endsWith(`- ${code}`)) ?? group[0];
  });
}

export function toImpsTransfer(raw: unknown): ImpsTransfer {
  const f = fields(raw);
  return {
    id: f.int('Id'),
    createdTime: f.text('createdTime'),
    amount: f.amount('amount'),
    utr: f.str('utr'),
    status: f.text('status'),
    accountHolderName: f.text('accountHolderName'),
    accountNumber: f.text('accountNumber'),
    ifsc: f.text('ifsc'),
    senderName: f.text('senderName'),
    senderMobile: f.text('senderMobile'),
  };
}

export function toAdminImpsRow(raw: unknown): AdminImpsRow {
  const f = fields(raw);
  return {
    ...toImpsTransfer(raw),
    walletId: f.int('walletId'),
    customerName: f.str('customerName'),
    retailerMobile: null,
    storeName: null,
  };
}

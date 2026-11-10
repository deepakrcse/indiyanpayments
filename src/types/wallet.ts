export interface Wallet {
  walletId: number;
  customerId: number;
  currentBalance: number;
  payoutCharges: number;
  isActive: boolean;
}

export interface LedgerEntry {
  id: number;
  createdTime: string;
  txnType: string;
  channel: string;
  status: string;
  remarks: string;
  utr: string | null;
  senderName: string | null;
  senderMobile: string | null;
  accountHolderName: string | null;
  accountNumber: string | null;
  ifsc: string | null;
  debit: number;
  credit: number;
  charges: number;
  balance: number;
}

export interface MessageResult {
  message: string;
}

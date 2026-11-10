export interface Sender {
  id: number;
  mobileNumber: string;
  senderName: string;
  senderAddress: string;
  senderPan: string;
  senderAadhaar: string;
}

export interface Bank {
  bankCode: string;
  bankName: string;
  ifsc: string;
}

export interface BankAccount {
  id: number;
  mobileNumber: string;
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
  bankLogoUrl: string | null;
}

export interface BankVerification {
  accountNumber: string;
  ifsc: string;
  verifiedName: string;
}

export interface ImpsTransfer {
  id: number;
  createdTime: string;
  amount: number;
  utr: string | null;
  status: string;
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
  senderName: string;
  senderMobile: string;
}

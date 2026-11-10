export interface PipeBalance {
  pipeName: string;
  balance: number;
  status: string;
  message: string;
}

export interface DashboardSummary {
  pipeBalances: PipeBalance[];
  totalPipeBalance: number;
  totalWalletBalance: number;
  walletCount: number;
  difference: number;
}

export interface DashboardLogRow {
  id: number;
  createdTime: string;
  pipeName: string;
  pipeBalance: number;
  totalWalletBalance: number;
  walletCount: number;
  difference: number;
  pipeStatus: string;
  pipeMessage: string;
}

export interface DashboardExplain {
  walletCount: number;
  walletBalance: number;
  pipeBalance: number;
  difference: number;
  today: {
    pgCredit: number;
    impsSuccess: number;
    impsFailed: number;
    impsRefund: number;
    impsPending: number;
    bbpsSuccess: number;
    bbpsFailed: number;
    bbpsRefund: number;
    verifyDebit: number;
  };
}

export interface AdminImpsRow {
  id: number;
  createdTime: string;
  walletId: number;
  customerName: string | null;
  retailerMobile: string | null;
  storeName: string | null;
  amount: number;
  utr: string | null;
  status: string;
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
  senderName: string;
  senderMobile: string;
}

export interface CustomerBusinessRow {
  customerName: string | null;
  storeName: string | null;
  mobileNumber: string | null;
  walletId: number;
  businessDate: string;
  pgAmount: number;
  pgCount: number;
  impsAmount: number;
  impsCount: number;
  bbpsAmount: number;
  bbpsCount: number;
}

export interface Announcement {
  id: number;
  title: string;
  message: string;
  isActive: boolean;
  createdTime: string | null;
  updatedTime: string | null;
}

export interface AnnouncementInput {
  title: string;
  message: string;
  isActive: boolean;
}

/** The next static QR pulled from the pool (Qr/GetNext). The image is drawn client-side from the VPA. */
export interface StaticQr {
  qrId: number;
  vpa: string;
  qrName: string | null;
  chargeType: string | null;
  chargeValue: number | null;
  minCharge: number | null;
  dailyMaxLimit: number | null;
  remainingToday: number | null;
}

export interface QrCode {
  id: number | null;
  qrName: string | null;
  vpa: string | null;
  chargeType: string | null;
  chargeValue: number | null;
  minCharge: number | null;
  dailyMaxLimit: number | null;
  displayOrder: number | null;
  status: string | null;
}

export interface QrCodeInput {
  qrName: string;
  vpa: string;
  chargeType: 'PERCENT' | 'VALUE';
  chargeValue: number;
  minCharge: number;
  dailyMaxLimit: number;
  displayOrder: number;
}

export interface QrCollectInput {
  qrId: number;
  vpa: string;
  amount: number;
  utr: string;
  remarks?: string;
}

export interface QrRequest {
  id: number | null;
  createdTime: string | null;
  walletId: number | null;
  qrId: number | null;
  qrName: string | null;
  vpa: string | null;
  amount: number | null;
  charges: number | null;
  creditAmount: number | null;
  utr: string | null;
  status: string;
  approvedTime: string | null;
  walletClosingBalance: number | null;
  retailerName: string | null;
  /** The retailer's login (their mobile number). */
  username: string | null;
  storeName: string | null;
  /** The note the retailer typed — kept by this portal. */
  retailerRemarks: string | null;
  /** The remote's own remarks: an admin's rejection reason on a rejected request. */
  remarks: string | null;
}

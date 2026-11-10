import 'server-only';
import { fields } from '@/server/http/fields';
import type { QrCode, QrRequest, StaticQr } from '@/types/qr';

/** Qr/GetNext returns the QR's configuration — no image; the code is drawn from the VPA. */
export function toStaticQr(raw: unknown): StaticQr | null {
  const f = fields(raw);
  const qrId = f.num('QrId', 'Id');
  const vpa = f.str('Vpa');
  if (qrId == null || !vpa) return null;
  return {
    qrId,
    vpa,
    qrName: f.str('QrName'),
    chargeType: f.str('ChargeType'),
    chargeValue: f.num('ChargeValue'),
    minCharge: f.num('MinCharge'),
    dailyMaxLimit: f.num('DailyMaxLimit'),
    remainingToday: f.num('RemainingToday'),
  };
}

export function toQrCode(raw: unknown): QrCode {
  const f = fields(raw);
  const status = f.raw('status', 'isActive');
  return {
    id: f.num('Id', 'QrId'),
    qrName: f.str('QrName'),
    vpa: f.str('Vpa'),
    chargeType: f.str('ChargeType'),
    chargeValue: f.num('ChargeValue'),
    minCharge: f.num('MinCharge'),
    dailyMaxLimit: f.num('DailyMaxLimit'),
    displayOrder: f.num('DisplayOrder'),
    status: status === undefined ? null : typeof status === 'boolean' ? (status ? 'Active' : 'Inactive') : String(status),
  };
}

export function toQrRequest(raw: unknown): QrRequest {
  const f = fields(raw);
  return {
    id: f.num('Id'),
    createdTime: f.str('createdTime'),
    walletId: f.num('walletId'),
    qrId: f.num('QrId'),
    qrName: f.str('QrName'),
    vpa: f.str('Vpa'),
    amount: f.num('Amount'),
    charges: f.num('charges'),
    creditAmount: f.num('creditAmount'),
    utr: f.str('UTR'),
    status: (f.str('status') ?? '').toUpperCase(),
    approvedTime: f.str('approvedTime'),
    walletClosingBalance: f.num('walletClosingBalance'),
    retailerName: f.str('retailerName'),
    username: f.str('username'),
    storeName: f.str('storeName'),
    retailerRemarks: f.str('retailerRemarks'),
    remarks: f.str('remarks'),
  };
}

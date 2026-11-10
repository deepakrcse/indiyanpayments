import 'server-only';
import { masterClientId } from '@/server/config/env';
import { badGateway, notFound } from '@/server/http/errors';
import { firstOf, rowsOf } from '@/server/http/fields';
import { remotePost } from '@/server/http/remote-api';
import { toQrCode, toQrRequest, toStaticQr } from '@/server/mappers/qr.mapper';
import { qrRemarkStore } from '@/server/storage/qr-remark-store';
import type { QrCode, QrCodeInput, QrCollectInput, QrRequest, StaticQr } from '@/types/qr';
import { walletOwners } from './wallet-owners.service';

/**
 * Pulls the next QR from the client's pool. The pool has a daily limit — "No QR available or
 * daily limit exhausted" is a normal answer, passed through as a 404 with that message.
 * GetNext's data is a single-element array, unwrapped here.
 */
export async function nextStaticQr(): Promise<StaticQr> {
  const result = await remotePost('Qr/GetNext', { client_ID: masterClientId() });
  const row = result.ok ? firstOf(result.data) : null;
  const qr = row ? toStaticQr(row) : null;
  if (!qr) throw notFound(result.message || 'No QR code is available right now.');
  return qr;
}

export async function createCollectRequest(walletId: number, input: QrCollectInput) {
  const remarks = input.remarks?.trim() || null;
  const result = await remotePost('Qr/Request/Insert', {
    client_ID: masterClientId(),
    walletId,
    qrId: input.qrId,
    vpa: input.vpa,
    amount: input.amount,
    utr: input.utr,
    remarks,
  });
  if (!result.ok) throw badGateway(result.message, 'The request could not be created.');
  // The remote does not keep the retailer's note, so this portal does.
  if (remarks) await qrRemarkStore.add(walletId, input.qrId, input.utr, input.amount, remarks);
  return { message: result.message || 'Request created.' };
}

/** Puts the retailer's own note back on each row, leaving the remote's remarks untouched. */
async function withRetailerRemarks(rows: QrRequest[]): Promise<QrRequest[]> {
  return Promise.all(
    rows.map(async (row) => {
      if (row.walletId == null || row.qrId == null || row.amount == null || !row.utr) return row;
      const note = await qrRemarkStore.find(row.walletId, row.qrId, row.utr, row.amount);
      return note ? { ...row, retailerRemarks: note } : row;
    }),
  );
}

/** Adds the shop name from each wallet's owner — the remote names the retailer but not the shop. */
async function withShop(rows: QrRequest[]): Promise<QrRequest[]> {
  if (rows.length === 0) return rows;
  const owners = await walletOwners();
  return rows.map((row) => {
    const owner = row.walletId != null ? owners.get(row.walletId) : undefined;
    return owner ? { ...row, storeName: owner.store, retailerName: row.retailerName ?? owner.name } : row;
  });
}

async function requests(path: string, body: Record<string, unknown>, enrich: boolean): Promise<QrRequest[]> {
  const result = await remotePost(path, { client_ID: masterClientId(), ...body });
  if (!result.ok) throw badGateway(result.message, 'Could not load the QR requests.');
  const rows = rowsOf(result.data).map(toQrRequest);
  return withRetailerRemarks(enrich ? await withShop(rows) : rows);
}

/** A wallet's collect requests; walletId 0 pools every wallet on the client (admins). */
export const walletQrRequests = (walletId: number) => requests('Qr/Request/Report', { walletId }, walletId === 0);

/** Every request across the client, regardless of wallet — the remote's client-wide view. */
export const allQrRequests = () => requests('Qr/Request/Report', {}, true);

export const pendingQrRequests = () => requests('Qr/Request/Pending', {}, true);

export async function approveQrRequest(id: number) {
  const result = await remotePost('Qr/Request/Approve', { id, client_ID: masterClientId() });
  if (!result.ok) throw badGateway(result.message, 'The request could not be approved.');
  return { message: result.message || 'Approved.' };
}

export async function rejectQrRequest(id: number, remarks: string) {
  const result = await remotePost('Qr/Request/Reject', { id, client_ID: masterClientId(), remarks });
  if (!result.ok) throw badGateway(result.message, 'The request could not be rejected.');
  return { message: result.message || 'Rejected.' };
}

export async function listQrCodes(): Promise<QrCode[]> {
  const result = await remotePost('Qr/SelectAll', { client_ID: masterClientId() });
  if (!result.ok) throw badGateway(result.message, 'Could not load the QR codes.');
  return rowsOf(result.data).map(toQrCode);
}

export async function createQrCode(input: QrCodeInput) {
  const result = await remotePost('Qr/Insert', { client_ID: masterClientId(), ...input });
  if (!result.ok) throw badGateway(result.message, 'The QR code could not be added.');
  return { message: result.message || 'QR code added.' };
}

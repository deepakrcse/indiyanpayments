import type { QrRequest } from '@/types/qr';

/**
 * A QR request has two kinds of remark: the note the retailer typed (kept by this portal), and —
 * on a rejected request — the admin's reason (the remote's own remarks). Both are shown when both
 * exist, so a rejection never hides the retailer's note.
 */
export function qrRemarkParts(row: Pick<QrRequest, 'retailerRemarks' | 'remarks' | 'status'>) {
  const note = (row.retailerRemarks ?? '').trim();
  const server = (row.remarks ?? '').trim();
  const rejected = (row.status ?? '').toUpperCase() === 'REJECTED';
  return { note: note || (rejected ? '' : server), reason: rejected ? server : '' };
}

/** The same, as one line (for exports). */
export function qrRemarkText(row: Pick<QrRequest, 'retailerRemarks' | 'remarks' | 'status'>) {
  const { note, reason } = qrRemarkParts(row);
  return [note, reason && `Rejected: ${reason}`].filter(Boolean).join(' · ');
}

import 'server-only';
import { randomBytes } from 'node:crypto';
import { env, masterClientId } from '@/server/config/env';
import { cache, HOUR } from '@/server/cache/memory-cache';
import { badGateway, badRequest, notFound } from '@/server/http/errors';
import { fields, rowsOf } from '@/server/http/fields';
import { remotePost } from '@/server/http/remote-api';
import { toPaymentLink, toPgTransfer, toWalletGateway } from '@/server/mappers/pg.mapper';
import { isoDateInZone } from '@/server/time';
import { PATTERNS } from '@/lib/validation/patterns';
import type { SessionUser } from '@/types/auth';
import type { PaymentLink, PaymentLinkInput, PaymentStatus, PgTransfer, WalletGateway } from '@/types/pg';

/** The gateways mapped to a wallet. "No PGs mapped" is a normal empty state, not a failure. */
export async function gatewaysForWallet(walletId: number): Promise<WalletGateway[]> {
  const result = await remotePost('Pg/SelectByWallet', { client_ID: masterClientId(), walletId });
  if (!result.ok) {
    if (/no pgs mapped/i.test(result.message)) return [];
    throw badGateway(result.message, 'Could not load the payment gateways.');
  }
  return rowsOf(result.data).map(toWalletGateway);
}

const tokenKey = (token: string) => `pg-return:${token}`;

/**
 * Generates a payment link. The reference does not exist until the link does, so it cannot go
 * in the redirect URL: a random token goes in instead, tied to the reference once issued. The
 * payer returns to the wallet page, which shows this payment's result.
 */
export async function generatePaymentLink(walletId: number, input: PaymentLinkInput, requestOrigin: string): Promise<PaymentLink> {
  const token = randomBytes(16).toString('hex');
  const base = env().PG_REDIRECT_BASE_URL || requestOrigin;

  const result = await remotePost('pg/GenerateLink', {
    client_ID: masterClientId(),
    walletId,
    pgCode: input.pgCode,
    custName: input.customerName,
    card_last_4_digit: input.cardLast4,
    amount: input.amount,
    redirectURL: `${base}/wallet?t=${token}`,
  });
  if (!result.ok) throw badGateway(result.message, 'The payment link could not be generated.');

  const link = toPaymentLink(result.data);
  let reference = link.refNo;
  if (!reference && link.pgLink) {
    try {
      reference = new URL(link.pgLink).searchParams.get('referenceNumber') ?? '';
    } catch {
      /* not an absolute URL — no reference to recover */
    }
  }
  if (reference) cache.set(tokenKey(token), reference, 24 * HOUR);
  return { ...link, refNo: reference };
}

const SUCCESS_STATES = new Set(['SUCCESS', 'SUCCESSFUL', 'SUCCEEDED', 'COMPLETED', 'PAID', 'CAPTURED']);
const FAILED_STATES = new Set(['FAILED', 'FAILURE', 'DECLINED', 'CANCELLED', 'CANCELED', 'REJECTED', 'EXPIRED']);

/**
 * The result of one payment. Public on purpose — the payer is usually not signed in — so it only
 * answers for a reference that belongs to the master client (Pg/CheckStatus itself is not
 * client-scoped and would confirm any tenant's payment). The wallet's closing balance is only
 * included for the wallet's own signed-in owner, or an admin.
 */
export async function paymentStatus(args: { referenceId?: string | null; token?: string | null }, viewer: SessionUser | null): Promise<PaymentStatus> {
  let reference = args.referenceId?.trim() ?? '';
  if (!reference && args.token) {
    const fromToken = cache.get<string>(tokenKey(args.token.trim()));
    if (!fromToken) throw notFound('This link has expired. Enter your reference number to check the payment.');
    reference = fromToken;
  }
  if (!PATTERNS.reference.test(reference)) throw badRequest('Enter a valid reference number.');

  const report = await remotePost('pg/TransferReport', {
    client_ID: masterClientId(),
    walletId: 0,
    fromDate: isoDateInZone(-365),
    toDate: isoDateInZone(1),
  });
  if (!report.ok) throw badGateway(report.message);

  const owned = rowsOf(report.data)
    .map((r) => toPgTransfer(r, false))
    .find((r) => (r.pipeRefNumber ?? '').toLowerCase() === reference.toLowerCase());
  if (!owned) throw notFound("We couldn't find a payment with that reference number.");

  const canSeeBalance = viewer !== null && (viewer.role === 'admin' || viewer.walletId === owned.walletId);
  const status: PaymentStatus = {
    referenceId: reference,
    outcome: 'pending',
    message: '',
    amount: owned.amount,
    utr: null,
    cardNumber: owned.cardNumber || null,
    closingBalance: null,
  };

  const check = await remotePost('Pg/CheckStatus', { reference_id: reference });
  if (!check.ok || !check.data) {
    // "Transaction not found in vendor": the link exists but the payer never got as far as paying.
    status.message = 'This payment has not been completed yet.';
    return status;
  }

  const v = fields(check.data);
  const state = (v.str('vendorStatus') ?? '').trim().toUpperCase();
  status.utr = v.str('utr');
  status.amount = v.num('amount') ?? owned.amount;
  const closing = v.num('walletClosingBalance') ?? owned.walletClosingBalance;
  status.closingBalance = canSeeBalance ? closing : null;

  if (v.bool('credited') === true || SUCCESS_STATES.has(state)) {
    status.outcome = 'success';
    status.message = 'Payment successful.';
  } else if (FAILED_STATES.has(state)) {
    status.outcome = 'failed';
    status.message = 'Payment failed. No amount was debited.';
  } else {
    status.message = 'Payment is still being processed.';
  }
  return status;
}

/** Every link a wallet generated over a date range. walletId 0 pools every wallet (admins). */
export async function pgTransferReport(walletId: number, fromDate: string, toDate: string, withMargins: boolean): Promise<PgTransfer[]> {
  const result = await remotePost('pg/TransferReport', { client_ID: masterClientId(), walletId, fromDate, toDate });
  if (!result.ok) throw badGateway(result.message);
  return rowsOf(result.data).map((r) => toPgTransfer(r, withMargins));
}

/** Admin: every retailer's PG links, client-wide. */
export async function adminPgReport(fromDate: string, toDate: string): Promise<PgTransfer[]> {
  const result = await remotePost('Admin/PgTransferReport', { client_ID: masterClientId(), fromDate, toDate });
  if (!result.ok) throw badGateway(result.message);
  return rowsOf(result.data).map((r) => toPgTransfer(r, true));
}

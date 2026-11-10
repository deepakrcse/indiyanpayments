import 'server-only';
import { randomBytes } from 'node:crypto';
import { env, masterClientId } from '@/server/config/env';
import { cache, HOUR, MINUTE, once } from '@/server/cache/memory-cache';
import { badGateway, badRequest, conflict, serviceUnavailable, unprocessable } from '@/server/http/errors';
import { fields, rowsOf } from '@/server/http/fields';
import { externalPost, remotePost } from '@/server/http/remote-api';
import type { Biller, BillPaymentResult, BillSummary, CardBillPayment, FetchBillInput } from '@/types/bbps';
import { walletOwners } from './wallet-owners.service';

/** Only categories this portal offers are passed through. */
const CATEGORIES: Record<string, string> = { 'credit-card': 'CREDIT CARD' };

interface FetchedBill {
  billerId: string;
  mobile: string;
  cardNumber: string;
  customerName: string;
  minPayable: number | null;
  maxPayable: number | null;
  fetchId: string | null;
  custParam: { name: string; value: string }[];
  walletId: number;
}

const fetchKey = (ref: string) => `bbps-fetch:${ref}`;
const paidKey = (ref: string) => `bbps-paid:${ref}`;

function toBiller(raw: unknown): Biller {
  const f = fields(raw);
  return {
    category: f.text('category'),
    billerId: f.text('billerId'),
    billerName: f.text('billerName'),
    customerParams: f.list('customerparams', 'customerParams').map((p) => {
      const pf = fields(p);
      const values = pf.list('values').map(String);
      return { paramName: pf.text('paramName'), dataType: pf.text('dataType'), optional: pf.bool('optional') ?? false, values: values.length ? values : null };
    }),
  };
}

/** The BBPS service has its own envelope: a boolean status. */
function bbpsEnvelope(json: unknown) {
  const f = fields(json);
  return { status: f.bool('status') === true, message: f.str('message'), data: f.raw('data') };
}

/** Every biller in a category. Rarely changes, so kept for an hour. */
export async function listBillers(category = 'credit-card'): Promise<Biller[]> {
  const name = CATEGORIES[category];
  if (!name) throw badRequest('Unknown bill category.');

  const key = `bbps-billers:${category}`;
  const hit = cache.get<Biller[]>(key);
  if (hit) return hit;

  const { BBPS_BILLERS_URL, BBPS_TIMEOUT_MS } = env();
  if (!BBPS_BILLERS_URL) throw serviceUnavailable('Card payments are not connected yet. Set BBPS_BILLERS_URL.');

  const res = await externalPost(BBPS_BILLERS_URL, { biller: name }, BBPS_TIMEOUT_MS);
  if (!res.ok) throw badGateway(res.message);
  const envelope = bbpsEnvelope(res.json);
  if (!envelope.status) throw badGateway(envelope.message, `Biller list request failed (${res.httpStatus}).`);

  const billers = rowsOf(envelope.data)
    .map(toBiller)
    .sort((a, b) => a.billerName.localeCompare(b.billerName, undefined, { sensitivity: 'base' }));
  cache.set(key, billers, HOUR);
  return billers;
}

/** The value typed for a biller's mobile or last-4 field, found by meaning — each biller names them differently. */
function valueOfKind(biller: Biller, values: Record<string, string>, kind: 'mobile' | 'card'): string {
  for (const param of biller.customerParams) {
    const name = param.paramName.toLowerCase();
    const matches = kind === 'mobile' ? name.includes('mobile') : /last\s*4|4\s*digit/.test(name);
    if (matches && values[param.paramName] != null) return values[param.paramName].trim();
  }
  return '';
}

/** The wordings billers use for "nothing to pay this cycle" — which also arrive as status false. */
const NO_BILL_DUE = /no\s+bill\s+due|payment\s+received|no\s+dues?\b|bill\s+(already\s+)?paid|no\s+(outstanding|pending)\s+(amount|bill)/i;

function toBillSummary(data: unknown, biller: Biller, reference: string): BillSummary {
  const d = fields(data);
  const details = fields(d.raw('billDetails'));
  const tags = fields(d.raw('additionalData')).list('tag').map(fields);
  const tag = (name: string) => tags.find((t) => (t.str('name') ?? '').toLowerCase() === name.toLowerCase())?.num('value') ?? null;
  return {
    reference: d.str('reference') ?? reference,
    fetchId: d.str('fetchId'),
    billerId: biller.billerId,
    billerName: biller.billerName,
    customerName: details.str('customerName')?.replace(/\s{2,}/g, ' ').trim() ?? null,
    totalDue: details.num('amount') ?? d.num('amount'),
    minimumDue: tag('Minimum Amount Due'),
    maxPayable: tag('Maximum Permissible Amount'),
    minPayable: d.num('minAmount'),
    dueDate: details.str('dueDate'),
    billDate: details.str('billDate'),
    noBillDue: false,
    message: null,
  };
}

/**
 * Fetches the bill for one card — which is also the check that the card details are right.
 * Parameter names come from the biller's own definition, never from the browser. What the
 * payment needs is kept server-side under the reference, so Pay can only pay this exact bill,
 * from the wallet that fetched it.
 */
export async function fetchBill(walletId: number, input: FetchBillInput): Promise<BillSummary> {
  const { BBPS_FETCH_BILL_URL, BBPS_TIMEOUT_MS } = env();
  if (!BBPS_FETCH_BILL_URL) throw serviceUnavailable('Bill fetch is not connected yet. Set BBPS_FETCH_BILL_URL.');

  const biller = (await listBillers('credit-card')).find((b) => b.billerId === input.billerId);
  if (!biller) throw badRequest('Unknown biller.');

  const custParam: { name: string; value: string }[] = [];
  for (const param of biller.customerParams) {
    const value = (input.values[param.paramName] ?? '').trim();
    if (!value) {
      if (param.optional) continue;
      throw badRequest(`${param.paramName} is required.`);
    }
    if (value.length > 64) throw badRequest(`${param.paramName} is too long.`);
    custParam.push({ name: param.paramName, value });
  }

  // The BBPS service wants a unique reference per fetch; it accepts one we generate.
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 17);
  const reference = `INDP${stamp}${randomBytes(6).toString('hex').toUpperCase()}`;

  const res = await externalPost(BBPS_FETCH_BILL_URL, { reference, billerId: biller.billerId, custParam }, BBPS_TIMEOUT_MS);
  if (!res.ok) throw badGateway(res.message);
  const envelope = bbpsEnvelope(res.json);

  if (!envelope.status && envelope.message && NO_BILL_DUE.test(envelope.message)) {
    return {
      reference, fetchId: null, billerId: biller.billerId, billerName: biller.billerName, customerName: null,
      totalDue: null, minimumDue: null, maxPayable: null, minPayable: null, dueDate: null, billDate: null,
      noBillDue: true, message: envelope.message,
    };
  }
  // A wrong card/mobile pair is the biller saying no; its words go to the person.
  if (!envelope.status) throw unprocessable(envelope.message, 'Could not fetch the bill.');

  const summary = toBillSummary(envelope.data, biller, reference);
  cache.set(
    fetchKey(summary.reference),
    {
      billerId: biller.billerId,
      mobile: valueOfKind(biller, input.values, 'mobile'),
      cardNumber: valueOfKind(biller, input.values, 'card'),
      customerName: summary.customerName ?? '',
      minPayable: summary.minPayable,
      maxPayable: summary.maxPayable,
      fetchId: summary.fetchId,
      custParam,
      walletId,
    } satisfies FetchedBill,
    30 * MINUTE,
  );
  return summary;
}

const rupees = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Pays a fetched bill from the wallet that fetched it. The browser supplies only the reference
 * and an amount inside the bill's limits; a reference can be paid once, and a double click
 * cannot pay twice.
 */
export async function payBill(walletId: number, reference: string, amount: number): Promise<BillPaymentResult> {
  const bill = cache.get<FetchedBill>(fetchKey(reference));
  if (!bill || bill.walletId !== walletId) throw badRequest('This bill has expired. Fetch the bill again to pay.');
  if (cache.has(paidKey(reference))) throw conflict('This bill has already been paid.');
  if (bill.minPayable != null && amount < bill.minPayable) throw badRequest(`The least you can pay is ${rupees(bill.minPayable)}.`);
  if (bill.maxPayable != null && amount > bill.maxPayable) throw badRequest(`The most you can pay is ${rupees(bill.maxPayable)}.`);

  const run = await once(`bbps-pay:${reference}`, async () => {
    const result = await remotePost('Bbps/CreditCard/Pay', {
      client_ID: masterClientId(),
      walletId,
      amount,
      billerId: bill.billerId,
      mobile: bill.mobile,
      cardNumber: bill.cardNumber,
      customerName: bill.customerName,
      reference_id: reference,
      // The same identifiers the bill was fetched with, under the biller's own field names —
      // the BBPS network rejects a payment whose fields do not match.
      custParam: bill.custParam,
      fetchId: bill.fetchId,
    });
    if (!result.ok) throw unprocessable(result.message, 'The payment did not go through.');
    cache.set(paidKey(reference), true, 24 * HOUR);
    return { message: result.message || 'Payment successful.', amount, reference };
  });
  if (run.busy) throw conflict('This payment is already being processed.');
  return run.result;
}

const REPORT_STATUSES = new Set(['SUCCESS', 'FAILED', 'PENDING']);

/** Card-bill payments over a date range; walletId 0 is every wallet on the client (admins). */
export async function cardBillReport(walletId: number, fromDate: string, toDate: string, status: string | null): Promise<CardBillPayment[]> {
  const wanted = status?.toUpperCase() || null;
  if (wanted && !REPORT_STATUSES.has(wanted)) throw badRequest('Unknown status.');

  const result = await remotePost('Bbps/CreditCard/Report', { client_ID: masterClientId(), walletId, fromDate, toDate, status: wanted });
  if (!result.ok) throw badGateway(result.message);

  const rows = rowsOf(result.data);
  const owners = rows.length > 0 ? await walletOwners() : new Map();
  return rows.map((raw) => {
    const f = fields(raw);
    const owner = owners.get(f.int('walletId'));
    return {
      id: f.num('Id'),
      createdTime: f.str('createdTime'),
      walletId: f.num('walletId'),
      txnType: f.str('txntype', 'txnType'),
      amount: f.amount('Amount'),
      charges: f.amount('charges'),
      closingBalance: f.num('closingbalance', 'closingBalance'),
      npciRef: f.str('npciRef'),
      status: (f.str('status') ?? '').toUpperCase(),
      consumerName: f.str('ConsumerName', 'customerName'),
      cardNumber: f.str('cardNumber', 'card_number'),
      retailerName: f.str('retailerName') ?? owner?.name ?? null,
      retailerMobile: f.str('MOBILE_NUMBER', 'username') ?? owner?.mobile ?? null,
      storeName: owner?.store ?? f.str('storeName'),
    };
  });
}

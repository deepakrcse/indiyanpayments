import { ArrowLeftRight, BookOpen, CreditCard, QrCode, Receipt, Users, WalletCards } from 'lucide-react';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/cn';
import { dateOnly, dateTime, dayMonthYear, rupees, timeOnly } from '@/lib/format';
import { StatusBadge } from '@/components/ui/badge';
import { Stacked } from '@/components/ui/table';
import { qrRemarkParts, qrRemarkText } from '@/features/qr/remarks';
import type { AdminImpsRow, CustomerBusinessRow } from '@/types/admin';
import type { CardBillPayment } from '@/types/bbps';
import type { ImpsTransfer } from '@/types/imps';
import type { PgTransfer } from '@/types/pg';
import type { QrRequest } from '@/types/qr';
import type { LedgerEntry } from '@/types/wallet';
import type { ReportColumn, ReportDefinition } from './types';

const GREEN: [number, number, number] = [5, 150, 105];
const RED: [number, number, number] = [225, 29, 72];
const money = (n: number | null | undefined) => (n == null ? '' : Number(n).toFixed(2));

// ── Shared column builders ────────────────────────────────────────────────
const idCol = <R,>(get: (r: R) => number | null): ReportColumn<R> => ({ header: 'ID', value: (r) => get(r) ?? '', cell: (r) => <span className="font-semibold text-ink-900 tabular">#{get(r) ?? '—'}</span>, width: 0.45 });
/** Date over time, so a time column is half as wide on screen: "10 Nov 2026" / "01:49 pm". */
const When = ({ iso }: { iso: string | null | undefined }) =>
  iso ? (
    <span className="block leading-tight whitespace-nowrap">
      {dateOnly(iso)}
      <span className="mt-0.5 block text-[11.5px] text-slate-500">{timeOnly(iso)}</span>
    </span>
  ) : (
    '—'
  );
const timeCol = <R,>(get: (r: R) => string | null): ReportColumn<R> => ({ header: 'Time', value: (r) => get(r) ?? '', cell: (r) => <When iso={get(r)} />, width: 1.3 });
const statusCol = <R,>(get: (r: R) => string | null): ReportColumn<R> => ({ header: 'Status', value: (r) => get(r) ?? '', cell: (r) => <StatusBadge status={get(r)} />, width: 0.8 });
const amountCol = <R,>(header: string, get: (r: R) => number | null, strong = false): ReportColumn<R> => ({
  header,
  value: (r) => money(get(r)),
  cell: (r) => <span className={cn(strong && 'font-bold text-ink-900')}>{get(r) == null ? '—' : rupees(get(r))}</span>,
  align: 'right',
  width: 0.85,
});


// ── Ledger (own wallet, and the admin's per-retailer view) ────────────────
const ledgerColumns: ReportColumn<LedgerEntry>[] = [
  idCol((r) => r.id),
  timeCol((r) => r.createdTime),
  {
    header: 'Type',
    value: (r) => r.txnType,
    cell: (r) => <span className={cn('text-[12px] font-extrabold', r.txnType === 'CREDIT' ? 'text-jade-600' : 'text-rose-600')}>{r.txnType}</span>,
    width: 0.65,
    pdfColor: (r) => (r.txnType === 'CREDIT' ? GREEN : RED),
  },
  {
    header: 'Reason',
    value: (r) => r.accountHolderName || r.remarks,
    cell: (r) => (r.accountHolderName ? <Stacked primary={r.accountHolderName} secondary={`${r.accountNumber ?? ''} · ${r.ifsc ?? ''}`} /> : r.remarks || '—'),
    width: 1.6,
  },
  { header: 'Debit', value: (r) => money(r.debit), cell: (r) => (r.debit > 0 ? <span className="text-rose-600">{rupees(r.debit)}</span> : '—'), align: 'right', width: 0.85 },
  { header: 'Credit', value: (r) => money(r.credit), cell: (r) => (r.credit > 0 ? <span className="text-jade-600">{rupees(r.credit)}</span> : '—'), align: 'right', width: 0.85 },
  { header: 'Charges', value: (r) => money(r.charges), cell: (r) => (r.charges > 0 ? rupees(r.charges) : '—'), align: 'right', width: 0.75 },
  amountCol('Balance', (r) => r.balance, true),
  { header: 'UTR', value: (r) => r.utr ?? '', cell: (r) => <span className="font-mono text-[12px]">{r.utr || '—'}</span>, width: 1.1 },
  statusCol((r) => r.status),
];

const ledger: ReportDefinition<LedgerEntry> = {
  key: 'ledger',
  label: 'Wallet ledger',
  description: 'Every debit and credit on your wallet',
  icon: BookOpen,
  parent: 'reports',
  fetch: (p) => api.get('/api/ledger', { ...p }),
  columns: ledgerColumns,
  rowKey: (r) => r.id,
};

// ── IMPS transfers ────────────────────────────────────────────────────────
const transfers: ReportDefinition<ImpsTransfer> = {
  key: 'transfers',
  label: 'IMPS transfers',
  description: 'Bank transfers over a date range',
  icon: Receipt,
  parent: 'reports',
  fetch: (p) => api.get('/api/transfers', { ...p }),
  rowKey: (r) => r.id,
  columns: [
    idCol((r) => r.id),
    timeCol((r) => r.createdTime),
    { header: 'Account', value: (r) => r.accountHolderName, cell: (r) => <Stacked primary={r.accountHolderName} secondary={`${r.accountNumber} · ${r.ifsc}`} />, only: 'screen' },
    { header: 'Account holder', value: (r) => r.accountHolderName, only: 'export', width: 1.4 },
    { header: 'Account number', value: (r) => r.accountNumber, only: 'export', width: 1.3 },
    { header: 'IFSC', value: (r) => r.ifsc, only: 'export', width: 0.95 },
    { header: 'Sender', value: (r) => r.senderName, cell: (r) => <Stacked primary={r.senderName} secondary={r.senderMobile} />, width: 1.1 },
    amountCol('Amount', (r) => r.amount, true),
    { header: 'UTR', value: (r) => r.utr ?? '', cell: (r) => <span className="font-mono text-[12px]">{r.utr || '—'}</span>, width: 1.1 },
    statusCol((r) => r.status),
  ],
  receipt: (r) => ({
    title: 'IMPS transfer receipt',
    status: r.status,
    rows: [
      ['Transaction ID', r.id],
      ['Date & time', dateTime(r.createdTime)],
      ['Sender', `${r.senderName} (${r.senderMobile})`],
      ['Account holder', r.accountHolderName],
      ['Account number', r.accountNumber],
      ['IFSC', r.ifsc],
      ['Amount', rupees(r.amount)],
      ['UTR', r.utr || '—'],
    ],
  }),
};

// ── PG links ──────────────────────────────────────────────────────────────
const pgPending = {
  isPending: (r: PgTransfer) => r.status.toUpperCase() === 'PENDING' && Boolean(r.pipeRefNumber),
  reference: (r: PgTransfer) => r.pipeRefNumber ?? '',
  id: (r: PgTransfer) => r.id,
};

function pgColumns(withMargins: boolean): ReportColumn<PgTransfer>[] {
  return [
    idCol((r) => r.id),
    timeCol((r) => r.createdTime),
    { header: 'PG', value: (r) => r.pgName, cell: (r) => <Stacked primary={r.pgName} secondary={<span className="font-mono">{r.pipeRefNumber || '—'}</span>} />, width: 1 },
    { header: 'Reference', value: (r) => r.pipeRefNumber ?? '', only: 'export', width: 1.5 },
    { header: 'Retailer', value: (r) => r.retailerName, cell: (r) => <Stacked primary={r.retailerName} secondary={r.retailerMobile} />, width: 1.1 },
    { header: 'Retailer mobile', value: (r) => r.retailerMobile, only: 'export', width: 1 },
    { header: 'Customer', value: (r) => r.payerName, width: 1.1 },
    { header: 'Card', value: (r) => r.cardNumber, cell: (r) => <span className="font-mono whitespace-nowrap">•••• {r.cardNumber}</span>, width: 0.7 },
    amountCol('Amount', (r) => r.amount, true),
    amountCol('Charges', (r) => r.charges),
    ...(withMargins
      ? [
          amountCol<PgTransfer>('Partner charges', (r) => r.partnerCharges),
          { ...amountCol<PgTransfer>('Profit', (r) => r.profit), cell: (r: PgTransfer) => <span className="font-bold text-jade-600">{rupees(r.profit)}</span>, pdfColor: () => GREEN },
        ]
      : []),
    statusCol((r) => r.status),
    { header: 'Credited', value: (r) => (r.walletCreditedTime ? dateTime(r.walletCreditedTime) : ''), cell: (r) => <When iso={r.walletCreditedTime} />, width: 1.3 },
    amountCol('Closing balance', (r) => r.walletClosingBalance),
  ];
}

const pgReport = (isAdmin: boolean): ReportDefinition<PgTransfer> => ({
  key: 'pg',
  label: 'Card collections',
  description: 'Payment links generated over a date range',
  icon: CreditCard,
  parent: 'reports',
  fetch: (p) => api.get('/api/pg/transfers', { ...p }),
  rowKey: (r) => r.id,
  columns: pgColumns(isAdmin),
  searchText: (r) => [r.payerName, r.cardNumber, r.pipeRefNumber],
  pending: pgPending,
});

// ── Credit card bills ─────────────────────────────────────────────────────
const cardBills = (isAdmin: boolean): ReportDefinition<CardBillPayment> => ({
  key: 'card-bills',
  label: 'Credit card bills',
  description: 'Card bill payments over a date range',
  icon: WalletCards,
  parent: 'reports',
  statusOptions: ['SUCCESS', 'FAILED', 'PENDING'],
  fetch: (p) => api.get('/api/bbps/payments', { ...p }),
  rowKey: (r, i) => r.id ?? i,
  columns: [
    idCol((r) => r.id),
    timeCol((r) => r.createdTime),
    ...(isAdmin
      ? [
          { header: 'Retailer', value: (r: CardBillPayment) => r.retailerName ?? '', cell: (r: CardBillPayment) => <Stacked primary={r.retailerName} secondary={r.retailerMobile} />, width: 1.1 },
          { header: 'Shop', value: (r: CardBillPayment) => r.storeName ?? '', width: 1.2 },
        ]
      : []),
    amountCol('Amount', (r) => r.amount, true),
    amountCol('Charges', (r) => r.charges),
    amountCol('Closing balance', (r) => r.closingBalance),
    { header: 'NPCI ref', value: (r) => r.npciRef ?? '', cell: (r) => <span className="font-mono text-[12px]">{r.npciRef || '—'}</span>, width: 1.5 },
    statusCol((r) => r.status),
    { header: 'Consumer', value: (r) => r.consumerName ?? '', width: 1.2 },
    { header: 'Card', value: (r) => r.cardNumber ?? '', cell: (r) => <span className="font-mono">{r.cardNumber || '—'}</span>, width: 1 },
  ],
  searchText: (r) => [r.npciRef, r.retailerName, r.retailerMobile, r.storeName],
  receipt: (r) => ({
    title: r.txnType === 'CREDIT' ? 'Card bill payment refund' : 'Card bill payment receipt',
    status: r.status,
    rows: [
      ['Transaction ID', r.id ?? '—'],
      ['Date & time', dateTime(r.createdTime)],
      ...(r.retailerName ? [['Retailer', r.retailerName] as [string, unknown]] : []),
      ...(r.storeName ? [['Shop', r.storeName] as [string, unknown]] : []),
      ['Consumer name', r.consumerName || '—'],
      ['Card number', r.cardNumber || '—'],
      ['Amount', rupees(r.amount)],
      ['Charges', rupees(r.charges)],
      ['NPCI ref', r.npciRef || '—'],
    ],
  }),
});

// ── QR collect requests ───────────────────────────────────────────────────
const remarksCol: ReportColumn<QrRequest> = {
  header: 'Remarks',
  value: (r) => qrRemarkText(r),
  cell: (r) => {
    const { note, reason } = qrRemarkParts(r);
    if (!note && !reason) return '—';
    return (
      <div className="max-w-64 text-[12.5px] whitespace-normal">
        {note && <div>{note}</div>}
        {reason && <div className="text-rose-600">Rejected: {reason}</div>}
      </div>
    );
  },
  width: 1.5,
};

const qr: ReportDefinition<QrRequest> = {
  key: 'qr',
  label: 'QR collections',
  description: 'Collect requests filed against your QR codes',
  icon: QrCode,
  parent: 'reports',
  fetch: (p) => api.get('/api/qr/requests', { walletId: p.walletId }),
  clientDateFilter: (r) => r.createdTime,
  rowKey: (r, i) => r.id ?? i,
  columns: [
    idCol((r) => r.id),
    timeCol((r) => r.createdTime),
    { header: 'Retailer', value: (r) => r.retailerName ?? '', cell: (r) => <Stacked primary={r.retailerName} secondary={r.username} />, width: 1.1 },
    { header: 'Retailer mobile', value: (r) => r.username ?? '', only: 'export', width: 1 },
    { header: 'QR', value: (r) => r.qrName ?? '', cell: (r) => <Stacked primary={r.qrName} secondary={r.vpa} />, width: 1.2 },
    remarksCol,
    amountCol('Amount', (r) => r.amount, true),
    { header: 'UTR', value: (r) => r.utr ?? '', cell: (r) => <span className="font-mono text-[12px]">{r.utr || '—'}</span>, width: 1 },
    statusCol((r) => r.status),
  ],
};

// ── Admin reports ─────────────────────────────────────────────────────────
const adminLedger: ReportDefinition<LedgerEntry> = {
  ...ledger,
  key: 'admin-ledger',
  label: 'Retailer ledger',
  description: "Any retailer's wallet ledger over a date range",
  adminOnly: true,
  parent: 'admin',
  needsCustomer: true,
};

const adminImps: ReportDefinition<AdminImpsRow> = {
  key: 'admin-imps',
  label: 'All IMPS transfers',
  description: "Every retailer's IMPS transfers, client-wide",
  icon: ArrowLeftRight,
  adminOnly: true,
  parent: 'admin',
  refundable: true,
  fetch: (p) => api.get('/api/admin/reports/imps', { fromDate: p.fromDate, toDate: p.toDate }),
  rowKey: (r) => r.id,
  columns: [
    idCol((r) => r.id),
    timeCol((r) => r.createdTime),
    { header: 'Retailer', value: (r) => r.customerName || `Wallet #${r.walletId}`, cell: (r) => <Stacked primary={r.customerName || `Wallet #${r.walletId}`} secondary={r.retailerMobile} />, width: 1.1 },
    { header: 'Retailer mobile', value: (r) => r.retailerMobile ?? '', only: 'export', width: 1 },
    { header: 'Shop', value: (r) => r.storeName ?? '', width: 1.2 },
    { header: 'Account', value: (r) => r.accountHolderName, cell: (r) => <Stacked primary={r.accountHolderName} secondary={`${r.accountNumber} · ${r.ifsc}`} />, only: 'screen' },
    { header: 'Account holder', value: (r) => r.accountHolderName, only: 'export', width: 1.4 },
    { header: 'Account number', value: (r) => r.accountNumber, only: 'export', width: 1.4 },
    { header: 'IFSC', value: (r) => r.ifsc, only: 'export', width: 1 },
    amountCol('Amount', (r) => r.amount, true),
    { header: 'UTR', value: (r) => r.utr ?? '', cell: (r) => <span className="font-mono text-[12px]">{r.utr || '—'}</span>, width: 1.1 },
    statusCol((r) => r.status),
  ],
};

const adminPg: ReportDefinition<PgTransfer> = {
  key: 'admin-pg',
  label: 'All card collections',
  description: "Every retailer's payment links, client-wide",
  icon: CreditCard,
  adminOnly: true,
  parent: 'admin',
  fetch: (p) => api.get('/api/admin/reports/pg', { fromDate: p.fromDate, toDate: p.toDate }),
  rowKey: (r) => r.id,
  columns: pgColumns(true),
  searchText: (r) => [r.payerName, r.cardNumber, r.pipeRefNumber],
  pending: pgPending,
};

const adminQr: ReportDefinition<QrRequest> = {
  key: 'admin-qr',
  label: 'All QR collections',
  description: "Every retailer's QR collect requests, client-wide",
  icon: QrCode,
  adminOnly: true,
  parent: 'admin',
  fetch: () => api.get('/api/qr/requests', { scope: 'all' }),
  clientDateFilter: (r) => r.createdTime,
  rowKey: (r, i) => r.id ?? i,
  columns: [
    idCol((r) => r.id),
    timeCol((r) => r.createdTime),
    { header: 'Retailer', value: (r) => r.retailerName ?? '', cell: (r) => <Stacked primary={r.retailerName} secondary={r.username} />, width: 1 },
    { header: 'Retailer mobile', value: (r) => r.username ?? '', only: 'export', width: 0.95 },
    { header: 'Shop', value: (r) => r.storeName ?? '', width: 1.1 },
    { header: 'QR', value: (r) => r.qrName ?? '', cell: (r) => <Stacked primary={r.qrName} secondary={r.vpa} />, width: 1.1 },
    { header: 'VPA', value: (r) => r.vpa ?? '', only: 'export', width: 1.4 },
    amountCol('Amount', (r) => r.amount, true),
    amountCol('Charges', (r) => r.charges),
    amountCol('Credit amount', (r) => r.creditAmount),
    { header: 'UTR', value: (r) => r.utr ?? '', cell: (r) => <span className="font-mono text-[12px]">{r.utr || '—'}</span>, width: 0.8 },
    statusCol((r) => r.status),
    { header: 'Approved', value: (r) => (r.approvedTime ? dateTime(r.approvedTime) : ''), cell: (r) => (r.approvedTime ? dateTime(r.approvedTime) : '—'), width: 1.3 },
    amountCol('Closing balance', (r) => r.walletClosingBalance),
    remarksCol,
  ],
};

const hasPg = (r: CustomerBusinessRow) => r.pgCount > 0;

const customerBusiness: ReportDefinition<CustomerBusinessRow> = {
  key: 'customer-business',
  label: 'Customer business',
  description: 'Day-wise card, IMPS and bill business of every customer',
  icon: Users,
  adminOnly: true,
  parent: 'admin',
  fetch: (p) => api.get('/api/admin/reports/customer-business', { fromDate: p.fromDate, toDate: p.toDate }),
  rowKey: (r, i) => `${r.walletId}-${r.businessDate}-${i}`,
  split: [
    { label: 'Collections active', tone: 'success', test: hasPg },
    { label: 'Collections inactive', tone: 'warning', test: (r) => !hasPg(r) },
  ],
  columns: [
    { header: 'Date', value: (r) => dayMonthYear(r.businessDate), width: 0.85 },
    { header: 'Customer', value: (r) => r.customerName ?? '', cell: (r) => <Stacked primary={r.customerName} secondary={[r.mobileNumber, r.storeName].filter(Boolean).join(' · ')} />, width: 1.3 },
    { header: 'Mobile', value: (r) => r.mobileNumber ?? '', only: 'export', width: 1 },
    { header: 'Store', value: (r) => r.storeName ?? '', only: 'export', width: 1.5 },
    { header: 'Collections', value: (r) => (hasPg(r) ? 'Active' : 'Inactive'), only: 'export', width: 0.8 },
    amountCol('Card collections', (r) => r.pgAmount, true),
    amountCol('IMPS', (r) => r.impsAmount),
    amountCol('Card bills', (r) => r.bbpsAmount),
  ],
};

/** Every report, keyed by its URL slug. Margin columns exist only in the admin's build. */
export function buildReports(isAdmin: boolean): Record<string, ReportDefinition<never>> {
  const all = [transfers, pgReport(isAdmin), cardBills(isAdmin), ledger, qr, adminLedger, adminImps, adminPg, adminQr, customerBusiness];
  return Object.fromEntries(all.filter((r) => isAdmin || !r.adminOnly).map((r) => [r.key, r as unknown as ReportDefinition<never>]));
}

export const RETAILER_REPORT_KEYS = ['transfers', 'pg', 'card-bills', 'ledger', 'qr'] as const;
export const ADMIN_REPORT_KEYS = ['admin-ledger', 'admin-imps', 'admin-pg', 'admin-qr', 'customer-business'] as const;

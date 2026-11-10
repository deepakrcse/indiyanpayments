'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Download, FileSpreadsheet, FileText, Printer, Search, Share2, Undo2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api/client';
import { cn } from '@/lib/cn';
import { qk } from '@/lib/api/query-keys';
import { todayIso } from '@/lib/dates';
import { plural } from '@/lib/format';
import { routes } from '@/config/routes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Card } from '@/components/ui/card';
import { DateRangeFields } from '@/components/ui/date-range';
import { Alert, EmptyState, LoadingRows } from '@/components/ui/feedback';
import { Label, Select } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { RowMenu } from '@/components/ui/row-menu';
import { SearchInput } from '@/components/ui/search-input';
import { SearchSelect } from '@/components/ui/search-select';
import { Table, TD, TH, THead, TR } from '@/components/ui/table';
import { useSession } from '@/features/auth/session-context';
import { useLetterhead } from '@/features/profile/use-letterhead';
import type { AdminImpsRow } from '@/types/admin';
import type { RetailerOption } from '@/types/customer';
import type { PaymentStatus } from '@/types/pg';
import { buildReports } from './definitions';
import { exportExcel, exportPdf, receiptAction, rowValues } from './report-actions';
import { RefundDialog } from './refund-dialog';
import type { ReportDefinition, ReportParams } from './types';

type Row = Record<string, unknown>;

// The table fits its card instead of scrolling sideways: headers may wrap ("Partner / charges"),
// cells sit closer together, and text wraps where it has spaces; amounts never break.
const TH_FIT = 'px-2 2xl:px-3 align-bottom leading-tight whitespace-normal first:pl-4 last:pr-4';
const TD_FIT = 'px-2 2xl:px-3 text-[12.5px] first:pl-4 last:pr-4';

/** Whole local days, from 00:00 of the first to just before the day after the last. */
function inRange(iso: string | null, from: string, to: string) {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= new Date(`${from}T00:00:00`).getTime() && t < new Date(`${to}T00:00:00`).getTime() + 86_400_000;
}

/**
 * One report: date range (and status / retailer where the report has them), Search, an instant
 * filter over the loaded rows, Excel and PDF exports of exactly what is on screen, per-row
 * receipts, a bank re-check for pending payments, and admin refunds.
 *
 * Opened from a customer's row on the Customers page, every wallet-based report reads that
 * customer's wallet (`?walletId=…&customer=…`) — admins only; the API ignores it for others.
 */
export function ReportView({ reportKey }: { reportKey: string }) {
  const { isAdmin } = useSession();
  const head = useLetterhead();
  const sp = useSearchParams();
  const reports = useMemo(() => buildReports(isAdmin), [isAdmin]);
  const def = reports[reportKey] as unknown as ReportDefinition<Row> | undefined;

  const scopedWallet = isAdmin && sp.get('walletId') ? Number(sp.get('walletId')) : null;
  const scopedName = sp.get('customer');

  const [range, setRange] = useState({ fromDate: todayIso(), toDate: todayIso() });
  const [status, setStatus] = useState('');
  const [retailerWallet, setRetailerWallet] = useState('');
  const [applied, setApplied] = useState({ ...range, status: '', retailerWallet: '' });
  const [query, setQuery] = useState('');
  const [overrides, setOverrides] = useState<Record<number, string>>({});
  const [refundRow, setRefundRow] = useState<AdminImpsRow | null>(null);

  const retailers = useQuery({
    queryKey: qk.retailers,
    queryFn: () => api.get<RetailerOption[]>('/api/retailers'),
    enabled: Boolean(def?.needsCustomer),
  });

  const params: ReportParams = {
    fromDate: applied.fromDate,
    toDate: applied.toDate,
    ...(applied.status ? { status: applied.status } : {}),
    ...(scopedWallet != null ? { walletId: scopedWallet } : def?.needsCustomer && applied.retailerWallet ? { walletId: Number(applied.retailerWallet) } : {}),
  };
  const waitingForCustomer = Boolean(def?.needsCustomer && scopedWallet == null && !applied.retailerWallet);

  const data = useQuery({
    queryKey: qk.report(reportKey, params as unknown as Record<string, unknown>),
    queryFn: () => def!.fetch(params),
    enabled: Boolean(def) && !waitingForCustomer,
  });

  const rows = useMemo(() => {
    let list = data.data ?? [];
    if (def?.clientDateFilter) list = list.filter((r) => inRange(def.clientDateFilter!(r), applied.fromDate, applied.toDate));
    if (def?.pending && Object.keys(overrides).length) {
      const p = def.pending;
      list = list.map((r) => (overrides[p.id(r)] && p.isPending(r) ? { ...r, status: overrides[p.id(r)] } : r));
    }
    return list;
  }, [data.data, def, applied.fromDate, applied.toDate, overrides]);

  const needle = query.trim().toLowerCase();
  const visible = useMemo(
    () => (needle && def ? rows.filter((r) => [...rowValues(def, r), ...(def.searchText?.(r) ?? [])].some((v) => String(v ?? '').toLowerCase().includes(needle))) : rows),
    [rows, needle, def],
  );

  if (!def) {
    return (
      <Card>
        <EmptyState title="This report doesn't exist">Pick a report from the Reports page.</EmptyState>
      </Card>
    );
  }

  const parent = scopedWallet != null ? routes.customers : def.parent === 'admin' ? routes.admin : routes.reports;
  const screenCols = def.columns.filter((c) => c.only !== 'export');
  const showRefresh = Boolean(def.pending) && visible.some((r) => def.pending!.isPending(r));
  const fileStem = `${def.key}-${applied.fromDate}-to-${applied.toDate}`;
  const isToday = applied.fromDate === todayIso() && applied.toDate === todayIso();

  // New filters fetch by themselves (a new query key); the same filters again mean "refresh".
  const search = () => {
    const next = { ...range, status, retailerWallet };
    setOverrides({});
    if (JSON.stringify(next) === JSON.stringify(applied)) data.refetch();
    else setApplied(next);
  };

  // Ask the bank about one pending payment. The report can lag behind the bank, so a final answer
  // replaces the PENDING shown here until the report catches up.
  const recheck = async (r: Row) => {
    const p = def.pending!;
    try {
      const check = await api.get<PaymentStatus>('/api/pg/status', { referenceId: p.reference(r) });
      await data.refetch();
      if (check.outcome !== 'pending') setOverrides((o) => ({ ...o, [p.id(r)]: check.outcome.toUpperCase() }));
      toast.message(`#${p.id(r)}: ${check.message}`, { description: check.outcome === 'success' && check.utr ? `UTR ${check.utr}` : undefined });
    } catch (err) {
      toast.error(`Couldn't refresh: ${errorMessage(err)}`);
      throw err; // so the button shakes as well
    }
  };

  const doReceipt = async (kind: 'print' | 'download' | 'share', r: Row) => {
    try {
      const lines = def.receipt!(r);
      await receiptAction(kind, lines, head, `${def.key}-receipt-${String(lines.rows[0]?.[1] ?? 'row')}.pdf`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  // The row's own actions — receipt, refund, bank re-check — shared by the table and the phone cards.
  const receiptButtons = (r: Row) => (
    <div className="inline-flex gap-0.5">
      {(
        [
          ['print', Printer, 'Print receipt'],
          ['download', Download, 'Download receipt'],
          ['share', Share2, 'Share receipt'],
        ] as const
      ).map(([kind, Icon, label]) => (
        <button key={kind} type="button" onClick={() => doReceipt(kind, r)} aria-label={label} title={label} className="rounded-lg p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-600">
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
  const refundMenu = (r: Row) => (
    <RowMenu label={`More actions for #${String(r.id)}`} actions={[{ label: 'Refund', icon: Undo2, danger: true, onSelect: () => setRefundRow(r as unknown as AdminImpsRow) }]} />
  );
  const recheckButton = (r: Row) =>
    def.pending!.isPending(r) ? <RefreshButton onRefresh={() => recheck(r)} title="Check this payment with the bank" variant="gold" /> : null;
  const cellOf = (c: (typeof screenCols)[number], r: Row) => (c.cell ? c.cell(r) : (c.value(r) ?? '—'));

  // Phones: one card per row, no sideways scrolling. ID and status head the card, the time sits
  // under them, every other column follows as label and value, two to a line; actions at the foot.
  const idCol = screenCols.find((c) => c.header === 'ID');
  const statusCol = screenCols.find((c) => c.header === 'Status');
  const timeCol = screenCols.find((c) => c.header === 'Time' || c.header === 'Date');
  const restCols = screenCols.filter((c) => c !== idCol && c !== statusCol && c !== timeCol);
  // A report with many columns can't fit a laptop screen as a table without becoming unreadable,
  // so it stays as cards (two a row) until the screen is wide enough; a narrower one is a table
  // from a tablet up.
  const wide = screenCols.length + (def.receipt ? 1 : 0) + (def.refundable ? 1 : 0) + (showRefresh ? 1 : 0) > 9;
  const cards = (list: Row[]) => (
    <ul className={cn('grid gap-3 bg-slate-50/70 p-3 md:grid-cols-2', wide ? 'xl:hidden' : 'md:hidden')}>
      {list.map((r, i) => {
        const pendingHere = showRefresh && def.pending!.isPending(r);
        const hasActions = Boolean(def.receipt || def.refundable || pendingHere);
        return (
          <li key={def.rowKey(r, i)} className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_14px_-10px_rgb(15_23_42/0.3)]">
            {(idCol || statusCol || timeCol) && (
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 pt-3 pb-2.5">
                <div className="min-w-0">
                  {idCol && <div className="text-[14px]">{cellOf(idCol, r)}</div>}
                  {timeCol && <div className="mt-0.5 text-[12px] text-slate-500">{cellOf(timeCol, r)}</div>}
                </div>
                {statusCol && <div className="shrink-0">{cellOf(statusCol, r)}</div>}
              </div>
            )}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-3">
              {restCols.map((c) => (
                <div key={c.header} className="min-w-0">
                  <dt className="text-[10.5px] font-bold tracking-wider text-slate-400 uppercase">{c.header}</dt>
                  <dd className="mt-0.5 text-[13px] text-slate-700 [overflow-wrap:anywhere] [&_*]:whitespace-normal">{cellOf(c, r)}</dd>
                </div>
              ))}
            </dl>
            {hasActions && (
              <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-2.5 py-1.5">
                <div>{def.receipt && receiptButtons(r)}</div>
                <div className="flex items-center gap-1">
                  {pendingHere && recheckButton(r)}
                  {def.refundable && refundMenu(r)}
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  const wideTable = (list: Row[]) => (
    <Table maxHeight="calc(100dvh - 340px)">
      <THead>
        <tr>
          {screenCols.map((c) => (
            <TH key={c.header} align={c.align} className={TH_FIT}>
              {c.header}
            </TH>
          ))}
          {def.receipt && (
            <TH align="right" className={TH_FIT}>
              Receipt
            </TH>
          )}
          {def.refundable && (
            <TH align="right" className={TH_FIT}>
              More
            </TH>
          )}
          {showRefresh && (
            <TH align="center" className={TH_FIT}>
              Re-check
            </TH>
          )}
        </tr>
      </THead>
      <tbody>
        {list.map((r, i) => (
          <TR key={def.rowKey(r, i)}>
            {screenCols.map((c) => (
              <TD key={c.header} align={c.align} className={cn(TD_FIT, c.align === 'right' && 'whitespace-nowrap')}>
                {cellOf(c, r)}
              </TD>
            ))}
            {def.receipt && (
              <TD align="right" className={TD_FIT}>
                {receiptButtons(r)}
              </TD>
            )}
            {def.refundable && (
              <TD align="right" className={TD_FIT}>
                {refundMenu(r)}
              </TD>
            )}
            {showRefresh && (
              <TD align="center" className={TD_FIT}>
                {recheckButton(r)}
              </TD>
            )}
          </TR>
        ))}
      </tbody>
    </Table>
  );

  // Cards on a phone, the table from a tablet up.
  const table = (list: Row[]) => (
    <>
      {cards(list)}
      <div className={wide ? 'max-xl:hidden' : 'max-md:hidden'}>{wideTable(list)}</div>
    </>
  );

  return (
    <>
      <PageHeader
        eyebrow={def.parent === 'admin' ? 'Admin report' : 'Report'}
        title={def.label}
        description={def.description}
        back={parent}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => exportPdf(def, visible, fileStem, `${applied.fromDate} to ${applied.toDate}${scopedName ? ` · ${scopedName}` : ''}`, head).catch((e) => toast.error(errorMessage(e)))} disabled={visible.length === 0}>
              <FileText className="size-4" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportExcel(def, visible, fileStem)} disabled={visible.length === 0}>
              <FileSpreadsheet className="size-4" /> Excel
            </Button>
          </>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 p-4">
          {def.needsCustomer && scopedWallet == null && (
            <div className="min-w-64">
              <Label>Retailer</Label>
              <SearchSelect
                size="sm"
                options={(retailers.data ?? []).map((c) => ({ value: String(c.walletId), label: c.fullName, hint: c.storeName }))}
                value={retailerWallet}
                onChange={setRetailerWallet}
                loading={retailers.isPending}
                placeholder="Type a name or store"
                emptyText="No retailer matches."
              />
            </div>
          )}
          <DateRangeFields fromDate={range.fromDate} toDate={range.toDate} onChange={setRange} />
          {def.statusOptions && (
            <div>
              <Label>Status</Label>
              <Select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 w-36">
                <option value="">All</option>
                {def.statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <Button className="h-10" onClick={search} loading={data.isFetching && !data.isPending}>
            <Search className="size-4" /> Search
          </Button>
          <SearchInput value={query} onChange={setQuery} placeholder="Filter any column" size="sm" className="ml-auto w-full sm:w-64" />
        </div>

        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 text-[12.5px] text-slate-500">
          {scopedName && (
            <Badge tone="brand">
              <UserRound className="size-3" /> {scopedName}
            </Badge>
          )}
          {isToday && <Badge tone="success">Today</Badge>}
          {data.isSuccess && (
            <span>
              {needle ? `Showing ${visible.length} of ${rows.length}` : plural(rows.length, 'entry', 'entries')}
            </span>
          )}
        </div>

        {waitingForCustomer && <EmptyState icon={<UserRound />} title="Choose a retailer">Pick a retailer above, then press Search to read their ledger.</EmptyState>}
        {!waitingForCustomer && data.isPending && <LoadingRows />}
        {data.isError && <Alert tone="danger" className="m-4">Couldn&apos;t load the report: {data.error.message}</Alert>}
        {data.isSuccess && rows.length === 0 && <EmptyState icon={<def.icon />} title="No entries in this date range" />}
        {data.isSuccess && rows.length > 0 && visible.length === 0 && <EmptyState icon={<Search />} title={`No entries match “${query.trim()}”`} />}

        {visible.length > 0 && !def.split && table(visible)}
        {visible.length > 0 && def.split && (
          <div className="grid gap-px bg-slate-100 xl:grid-cols-2">
            {def.split.map((side) => {
              const part = visible.filter(side.test);
              return (
                <section key={side.label} className="bg-white">
                  <div className="flex items-center gap-2 px-4 py-3">
                    <Badge tone={side.tone} dot>
                      {side.label}
                    </Badge>
                    <span className="text-[12px] font-semibold text-slate-500">{part.length}</span>
                  </div>
                  {part.length === 0 ? <p className="px-4 pb-6 text-[13px] text-slate-400">None in this range.</p> : table(part)}
                </section>
              );
            })}
          </div>
        )}
      </Card>

      {def.refundable && <RefundDialog row={refundRow} onClose={() => setRefundRow(null)} onDone={() => data.refetch()} />}
    </>
  );
}

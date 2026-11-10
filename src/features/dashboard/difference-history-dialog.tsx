'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, Search } from 'lucide-react';
import { api } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { todayIso } from '@/lib/dates';
import { dateTime, plural, rupees } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { DateRangeFields } from '@/components/ui/date-range';
import { Dialog } from '@/components/ui/dialog';
import { Alert, EmptyState, LoadingRows } from '@/components/ui/feedback';
import { StatusBadge } from '@/components/ui/badge';
import { Table, TD, TH, THead, TR } from '@/components/ui/table';
import type { DashboardLogRow } from '@/types/admin';

/** The dashboard's snapshots over a date range — pipe balance vs. the wallets' total — newest first. Opens on today. */
export function DifferenceHistoryDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [range, setRange] = useState({ fromDate: todayIso(), toDate: todayIso() });
  const [applied, setApplied] = useState(range);

  const log = useQuery({
    queryKey: qk.dashboardLog(applied.fromDate, applied.toDate),
    queryFn: () => api.get<DashboardLogRow[]>('/api/admin/dashboard/log', applied),
    enabled: open,
  });
  const rows = log.data ?? [];

  return (
    <Dialog open={open} onClose={onClose} size="full" title="Difference history" description="The pipe balance against the wallets' total at each check, newest first." icon={<History />}>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <DateRangeFields fromDate={range.fromDate} toDate={range.toDate} onChange={setRange} />
        <Button size="sm" className="h-10" onClick={() => setApplied(range)}>
          <Search className="size-4" /> Search
        </Button>
        {rows.length > 0 && <span className="ml-auto text-[12.5px] font-semibold text-slate-500">{plural(rows.length, 'entry', 'entries')}</span>}
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        {log.isPending && <LoadingRows rows={4} />}
        {log.isError && <Alert tone="danger" className="m-4">Couldn&apos;t load the history: {log.error.message}</Alert>}
        {log.isSuccess && rows.length === 0 && <EmptyState icon={<History />} title="No history in this range" />}
        {rows.length > 0 && (
          <Table maxHeight="60vh">
            <THead>
              <tr>
                <TH>Time</TH>
                <TH>Pipe</TH>
                <TH align="right">Pipe balance</TH>
                <TH align="right">Wallet balance</TH>
                <TH align="right">Wallets</TH>
                <TH align="right">Difference</TH>
                <TH>Status</TH>
              </tr>
            </THead>
            <tbody>
              {rows.map((r) => (
                <TR key={r.id}>
                  <TD className="whitespace-nowrap">{dateTime(r.createdTime)}</TD>
                  <TD className="font-semibold text-ink-900">{r.pipeName}</TD>
                  <TD align="right">{rupees(r.pipeBalance)}</TD>
                  <TD align="right">{rupees(r.totalWalletBalance)}</TD>
                  <TD align="right">{r.walletCount}</TD>
                  <TD align="right" className={cn('font-bold', r.difference >= 0 ? 'text-jade-600' : 'text-rose-600')}>
                    {rupees(r.difference)}
                  </TD>
                  <TD title={r.pipeMessage}>
                    <StatusBadge status={r.pipeStatus} />
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </Dialog>
  );
}

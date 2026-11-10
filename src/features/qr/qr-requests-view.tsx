'use client';

import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ClipboardList, Inbox, X } from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { dateTime, rupees } from '@/lib/format';
import { routes } from '@/config/routes';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Card, CardHeader } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog } from '@/components/ui/dialog';
import { Alert, EmptyState, LoadingRows } from '@/components/ui/feedback';
import { Field, Input } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { Stacked, Table, TD, TH, THead, TR } from '@/components/ui/table';
import { useMoneyMoved } from '@/features/wallet/use-wallet';
import type { QrRequest } from '@/types/qr';
import { qrRemarkParts } from './remarks';

function Remarks({ row }: { row: QrRequest }) {
  const { note, reason } = qrRemarkParts(row);
  if (!note && !reason) return <span className="text-slate-300">—</span>;
  return (
    <div className="max-w-64 text-[12.5px] whitespace-normal">
      {note && <div>{note}</div>}
      {reason && <div className="text-rose-600">Rejected: {reason}</div>}
    </div>
  );
}

function RequestsTable({ rows, actions }: { rows: QrRequest[]; actions?: (r: QrRequest) => React.ReactNode }) {
  return (
    <Table className="min-h-0 flex-1">
      <THead>
        <tr>
          <TH>Request</TH>
          <TH>Retailer</TH>
          <TH>Shop</TH>
          <TH>QR</TH>
          <TH align="right">Amount</TH>
          <TH>UTR</TH>
          <TH>Remarks</TH>
          <TH>{actions ? '' : 'Status'}</TH>
        </tr>
      </THead>
      <tbody>
        {rows.map((r, i) => (
          <TR key={r.id ?? i}>
            <TD>
              <Stacked primary={<span className="tabular">#{r.id ?? '—'}</span>} secondary={dateTime(r.createdTime)} />
            </TD>
            <TD>
              <Stacked primary={r.retailerName} secondary={r.username} />
            </TD>
            <TD className="font-semibold">{r.storeName || '—'}</TD>
            <TD>
              <Stacked primary={<span className="font-mono text-[12.5px]">{r.vpa ?? '—'}</span>} secondary={r.qrName} />
            </TD>
            <TD align="right">
              <Stacked primary={r.amount != null ? rupees(r.amount) : '—'} secondary={r.creditAmount != null ? `Credit ${rupees(r.creditAmount)}` : undefined} />
            </TD>
            <TD className="font-mono text-[12.5px]">{r.utr ?? '—'}</TD>
            <TD>
              <Remarks row={r} />
            </TD>
            <TD>{actions ? actions(r) : <StatusBadge status={r.status} />}</TD>
          </TR>
        ))}
      </tbody>
    </Table>
  );
}

/** Admin › QR requests: approve or reject what's waiting, then the full client-wide history. */
export function QrRequestsView() {
  const qc = useQueryClient();
  const moneyMoved = useMoneyMoved();
  const pending = useQuery({ queryKey: qk.qrPending, queryFn: () => api.get<QrRequest[]>('/api/qr/requests/pending') });
  const all = useQuery({ queryKey: qk.qrAll, queryFn: () => api.get<QrRequest[]>('/api/qr/requests', { scope: 'all' }) });
  const [approving, setApproving] = useState<QrRequest | null>(null);
  const [rejecting, setRejecting] = useState<QrRequest | null>(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ['qr'] });
    moneyMoved();
  };

  const approve = useMutation({
    mutationFn: (id: number) => api.post<{ message: string }>(`/api/qr/requests/${id}/approve`),
    onSuccess: (res) => {
      toast.success(res.message || 'Approved');
      setApproving(null);
      refreshAll();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const reject = useMutation({
    mutationFn: () => api.post<{ message: string }>(`/api/qr/requests/${rejecting!.id}/reject`, { remarks: reason.trim() }),
    onSuccess: (res) => {
      toast.success(res.message || 'Rejected');
      setRejecting(null);
      refreshAll();
    },
    onError: (err) => setReasonError(errorMessage(err)),
  });

  const submitReject = (e: FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return setReasonError('Enter a reason for rejecting this request.');
    setReasonError(null);
    reject.mutate();
  };


  return (
    <div className="flex flex-col xl:h-[calc(100dvh-var(--chrome-h))]">
      <PageHeader
        eyebrow="Admin"
        title="QR requests"
        description="Retailers file a collect request after a customer pays their static QR. Approving credits their wallet."
        back={routes.admin}
        actions={
          <RefreshButton onRefresh={() => qc.invalidateQueries({ queryKey: ['qr'] })} label="Refresh" title="Refresh QR requests" variant="outline" />
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <Card className="flex shrink-0 flex-col overflow-hidden xl:max-h-[45%]">
          <CardHeader title={`Waiting for approval${pending.data ? ` · ${pending.data.length}` : ''}`} icon={<Inbox />} />
          {pending.isPending && <LoadingRows rows={3} />}
          {pending.isError && <Alert tone="danger" className="m-5">{pending.error.message}</Alert>}
          {pending.isSuccess && pending.data.length === 0 && <EmptyState icon={<Inbox />} title="Nothing waiting on approval" className="py-5" />}
          {pending.data && pending.data.length > 0 && (
            <RequestsTable
              rows={pending.data}
              actions={(r) => (
                <div className="flex gap-1.5">
                  <Button size="xs" variant="success" disabled={r.id == null} onClick={() => setApproving(r)}>
                    <Check className="size-3.5" /> Approve
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    className="text-rose-600 hover:border-rose-300 hover:bg-rose-50"
                    disabled={r.id == null}
                    onClick={() => {
                      setReason('');
                      setReasonError(null);
                      setRejecting(r);
                    }}
                  >
                    <X className="size-3.5" /> Reject
                  </Button>
                </div>
              )}
            />
          )}
        </Card>

        <Card className="flex min-h-72 flex-col overflow-hidden xl:min-h-0 xl:flex-1">
          <CardHeader title="All requests" description="Every collect request on the client." icon={<ClipboardList />} />
          {all.isPending && <LoadingRows rows={4} />}
          {all.isError && <Alert tone="danger" className="m-5">{all.error.message}</Alert>}
          {all.isSuccess && all.data.length === 0 && <EmptyState icon={<ClipboardList />} title="No QR requests yet" />}
          {all.data && all.data.length > 0 && <RequestsTable rows={all.data} />}
        </Card>
      </div>

      <ConfirmDialog open={Boolean(approving)} onClose={() => setApproving(null)} onConfirm={() => approving?.id != null && approve.mutate(approving.id)} busy={approve.isPending} title="Approve this QR request?" confirmLabel="Approve" tone="primary">
        {approving && (
          <>
            {rupees(approving.amount)} from {approving.retailerName ?? 'the retailer'} (UTR <span className="font-mono">{approving.utr}</span>) will be credited to their wallet.
          </>
        )}
      </ConfirmDialog>

      <Dialog open={Boolean(rejecting)} onClose={() => !reject.isPending && setRejecting(null)} dismissible={!reject.isPending} title={`Reject request #${rejecting?.id ?? ''}`} icon={<X />} size="sm">
        <form onSubmit={submitReject} className="space-y-4">
          <Field label="Reason" error={reasonError} hint="The retailer sees this on their QR report.">
            {(p) => <Input {...p} autoFocus maxLength={200} placeholder="e.g. UTR not found" value={reason} onChange={(e) => setReason(e.target.value)} />}
          </Field>
          <div className="flex gap-2.5">
            <Button variant="outline" block onClick={() => setRejecting(null)} disabled={reject.isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" block loading={reject.isPending}>
              Reject
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

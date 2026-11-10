'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api/client';
import { rupees } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/feedback';
import { Field, Input } from '@/components/ui/field';
import { StatusBadge } from '@/components/ui/badge';
import type { AdminImpsRow } from '@/types/admin';

/** Admin: refund one IMPS transaction to its wallet. Nothing is sent until "Yes, refund". */
export function RefundDialog({ row, onClose, onDone }: { row: AdminImpsRow | null; onClose: () => void; onDone: () => void }) {
  const [remarks, setRemarks] = useState('');
  const refund = useMutation({
    mutationFn: () => api.post<{ message: string }>('/api/admin/refunds', { id: row!.id, remarks: remarks.trim() }),
    onSuccess: (res) => {
      toast.success(`#${row!.id}: ${res.message || 'Refund successful.'}`);
      setRemarks('');
      onDone();
      onClose();
    },
  });

  return (
    <Dialog open={Boolean(row)} onClose={() => !refund.isPending && onClose()} dismissible={!refund.isPending} title="Refund this transaction?" description="The amount goes back to the retailer's wallet. This can't be undone from here." icon={<Undo2 />} size="md">
      {row && (
        <div className="space-y-4">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-2xl bg-slate-50 p-4 text-[13px]">
            <dt className="text-slate-500">Transaction</dt>
            <dd className="font-semibold">#{row.id}</dd>
            <dt className="text-slate-500">Retailer</dt>
            <dd className="font-semibold">{row.customerName || `Wallet #${row.walletId}`}</dd>
            <dt className="text-slate-500">Account</dt>
            <dd className="font-semibold">
              {row.accountHolderName || '—'} · {row.accountNumber}
            </dd>
            <dt className="text-slate-500">Amount</dt>
            <dd className="font-bold text-ink-900">{rupees(row.amount)}</dd>
            <dt className="text-slate-500">Status</dt>
            <dd>
              <StatusBadge status={row.status} />
            </dd>
            <dt className="text-slate-500">UTR</dt>
            <dd className="font-mono">{row.utr || '—'}</dd>
          </dl>
          <Field label="Reason (optional)">
            {(p) => <Input {...p} autoFocus maxLength={200} placeholder="e.g. Bank transfer failed" value={remarks} onChange={(e) => setRemarks(e.target.value)} />}
          </Field>
          {refund.isError && <Alert tone="danger">{errorMessage(refund.error)}</Alert>}
          <div className="flex justify-end gap-2.5">
            <Button variant="outline" onClick={onClose} disabled={refund.isPending}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => refund.mutate()} loading={refund.isPending}>
              Yes, refund
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

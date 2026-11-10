'use client';

import { useQuery } from '@tanstack/react-query';
import { Download, History, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { cn } from '@/lib/cn';
import { RefreshButton } from '@/components/ui/refresh-button';
import { dateTime, rupees, timeOnly } from '@/lib/format';
import { Card, CardHeader } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Alert, EmptyState, LoadingRows } from '@/components/ui/feedback';
import { Stacked, Table, TD, TH, THead, TR } from '@/components/ui/table';
import { useLetterhead } from '@/features/profile/use-letterhead';
import type { BankAccount, ImpsTransfer } from '@/types/imps';
import { downloadImpsReceipt, shareImpsReceipt, type ImpsReceipt } from './receipt';

/**
 * History rows carry the account and IFSC but not the bank's name or logo — those live on the
 * sender's saved accounts, so they are looked up there before building that row's receipt.
 */
async function receiptFor(t: ImpsTransfer): Promise<ImpsReceipt> {
  let bankName = '';
  let bankLogoUrl: string | null = null;
  try {
    const accounts = await api.get<BankAccount[]>('/api/bank-accounts', { mobile: t.senderMobile });
    const match = accounts.find((a) => a.accountNumber === t.accountNumber) ?? accounts[0];
    bankName = match?.bankName ?? '';
    bankLogoUrl = match?.bankLogoUrl ?? null;
  } catch {
    /* the receipt still generates, without the bank's name and logo */
  }
  return {
    transactionId: t.id,
    dateTime: dateTime(t.createdTime),
    status: t.status,
    utr: t.utr,
    senderName: t.senderName,
    senderMobile: t.senderMobile,
    accountHolderName: t.accountHolderName,
    accountNumber: t.accountNumber,
    ifsc: t.ifsc,
    bankName,
    bankLogoUrl,
    amount: t.amount,
  };
}

export function TodayTransfers({ className }: { className?: string }) {
  const head = useLetterhead();
  const today = useQuery({ queryKey: qk.todayTransfers, queryFn: () => api.get<ImpsTransfer[]>('/api/transfers/today') });

  const run = async (t: ImpsTransfer, action: 'download' | 'share') => {
    try {
      const r = await receiptFor(t);
      if (action === 'download') await downloadImpsReceipt(r, head);
      else await shareImpsReceipt(r, head);
    } catch (err) {
      toast.error(`Couldn't create the receipt: ${errorMessage(err)}`);
    }
  };

  return (
    <Card className={cn('flex flex-col overflow-hidden', className)}>
      <CardHeader
        title="Today's transfers"
        description="IMPS payouts from your wallet today."
        icon={<History />}
        actions={
          <RefreshButton onRefresh={() => today.refetch()} title="Refresh today's transfers" />
        }
      />
      {today.isPending && <LoadingRows rows={3} />}
      {today.isError && <Alert tone="danger" className="m-5">{today.error.message}</Alert>}
      {today.isSuccess && today.data.length === 0 && <EmptyState icon={<History />} title="No transfers yet today" />}
      {today.data && today.data.length > 0 && (
        <Table className="max-h-[420px] lg:max-h-none lg:min-h-0 lg:flex-1">
          <THead>
            <tr>
              <TH>Time</TH>
              <TH>Beneficiary</TH>
              <TH align="right">Amount</TH>
              <TH>UTR</TH>
              <TH>Status</TH>
              <TH align="right">Receipt</TH>
            </tr>
          </THead>
          <tbody>
            {today.data.map((t) => (
              <TR key={t.id}>
                <TD>
                  <Stacked primary={timeOnly(t.createdTime)} secondary={`#${t.id}`} />
                </TD>
                <TD>
                  <Stacked primary={t.accountHolderName} secondary={`${t.accountNumber} · ${t.ifsc}`} />
                </TD>
                <TD align="right" className="font-bold text-ink-900">{rupees(t.amount)}</TD>
                <TD className="font-mono text-[12px]">{t.utr || '—'}</TD>
                <TD>
                  <StatusBadge status={t.status} />
                </TD>
                <TD align="right">
                  <div className="inline-flex gap-1">
                    <button type="button" onClick={() => run(t, 'download')} className="rounded-lg p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-600" aria-label="Download receipt" title="Download receipt">
                      <Download className="size-4" />
                    </button>
                    <button type="button" onClick={() => run(t, 'share')} className="rounded-lg p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-600" aria-label="Share receipt" title="Share receipt">
                      <Share2 className="size-4" />
                    </button>
                  </div>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}

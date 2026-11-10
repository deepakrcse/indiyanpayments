'use client';

import { CheckCircle2, Download, Share2 } from 'lucide-react';
import { rupees } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { useLetterhead } from '@/features/profile/use-letterhead';
import { downloadImpsReceipt, shareImpsReceipt, type ImpsReceipt } from './receipt';

/** The on-screen receipt for a transfer just sent. */
export function ReceiptDialog({ receipt, onClose }: { receipt: ImpsReceipt | null; onClose: () => void }) {
  const head = useLetterhead();
  return (
    <Dialog open={Boolean(receipt)} onClose={onClose} size="sm" hideClose>
      {receipt && (
        <div>
          <div className="text-center">
            <span className="mx-auto mt-2 grid size-16 place-items-center rounded-2xl bg-jade-50 text-jade-600">
              <CheckCircle2 className="size-8" />
            </span>
            <p className="mt-4 text-[13px] font-semibold text-slate-500">Transfer submitted</p>
            <p className="text-[30px] font-extrabold text-ink-900 tabular">{rupees(receipt.amount)}</p>
            <p className="text-[13px] text-slate-500">to {receipt.accountHolderName}</p>
          </div>
          <dl className="mt-5 divide-y divide-slate-100 rounded-2xl bg-slate-50 px-4 text-[13px]">
            {[
              ['Transaction ID', receipt.transactionId ?? '—'],
              ['Date & time', receipt.dateTime],
              ['Sender', `${receipt.senderName} · ${receipt.senderMobile}`],
              ['Account', `${receipt.accountNumber} · ${receipt.ifsc}`],
              ['Bank', receipt.bankName || '—'],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex justify-between gap-3 py-2.5">
                <dt className="text-slate-500">{label}</dt>
                <dd className="text-right font-semibold break-all text-ink-900">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => downloadImpsReceipt(receipt, head)}>
              <Download className="size-4" /> Download
            </Button>
            <Button variant="secondary" onClick={() => shareImpsReceipt(receipt, head)}>
              <Share2 className="size-4" /> Share
            </Button>
          </div>
          <Button block className="mt-2" onClick={onClose}>
            Done
          </Button>
        </div>
      )}
    </Dialog>
  );
}

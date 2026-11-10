'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, CheckCircle2, Copy, ExternalLink, Share2 } from 'lucide-react';
import { rupees } from '@/lib/format';
import { routes } from '@/config/routes';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/ui/badge';
import type { PaymentLink } from '@/types/pg';

/** The link just generated: what it charges, and the ways to get it to the customer. */
export function LinkResultDialog({ link, onClose }: { link: PaymentLink | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link.pgLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const share = async () => {
    if (!link) return;
    if (navigator.share) {
      await navigator.share({ title: 'Indiyana Payments — payment link', url: link.pgLink }).catch(() => {});
    } else {
      await copy();
    }
  };

  return (
    <Dialog open={Boolean(link)} onClose={onClose} size="md" title="Payment link ready" description="Share it with the customer — they pay on the gateway's secure page." icon={<CheckCircle2 />}>
      {link && (
        <>
          <dl className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4">
            {[
              ['Reference', <span key="r" className="font-mono text-[12.5px] break-all">{link.refNo || '—'}</span>],
              ['Status', <StatusBadge key="s" status={link.status} />],
              ['Amount', rupees(link.amount)],
              ['Charges', rupees(link.charges)],
              ['Credit to wallet', <span key="c" className="text-jade-600">{rupees(link.amount - link.charges)}</span>],
            ].map(([label, value]) => (
              <div key={String(label)} className="min-w-0">
                <dt className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">{label}</dt>
                <dd className="mt-0.5 text-[14px] font-bold text-ink-900 tabular">{value}</dd>
              </div>
            ))}
          </dl>

          <a href={link.pgLink} target="_blank" rel="noopener noreferrer" className="mt-4 block rounded-xl border border-dashed border-brand-300 bg-brand-50/50 px-3.5 py-3 text-[12.5px] font-semibold break-all text-brand-700 hover:bg-brand-50">
            {link.pgLink}
          </a>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Button variant="secondary" onClick={copy}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button variant="secondary" onClick={share}>
              <Share2 className="size-4" /> Share
            </Button>
            <Button variant="secondary" onClick={() => window.open(link.pgLink, '_blank', 'noopener,noreferrer')}>
              <ExternalLink className="size-4" /> Open
            </Button>
          </div>

          {link.refNo && (
            <Link href={`${routes.paymentStatus}?reference_id=${encodeURIComponent(link.refNo)}`} target="_blank" className="mt-4 block text-center text-[13px] font-bold text-brand-600 hover:text-brand-800">
              Check payment status →
            </Link>
          )}
        </>
      )}
    </Dialog>
  );
}

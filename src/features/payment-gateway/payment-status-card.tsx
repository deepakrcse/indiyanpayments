'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, Clock3, RefreshCw, SearchCheck, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/feedback';
import { Input } from '@/components/ui/field';
import { LAST_REFERENCE_KEY, rememberReference } from './saved-payers';
import { OUTCOME_TITLES, statusRows, usePaymentStatus } from './use-payment-status';

const REF_PARAMS = ['reference_id', 'referenceId', 'referenceNumber', 'ref', 'refNo', 'reference', 'ref_id'];

const ICONS = { success: CheckCircle2, failed: XCircle, pending: Clock3 };
const TONES = {
  success: 'bg-jade-50 text-jade-600 ring-jade-100',
  failed: 'bg-rose-50 text-rose-600 ring-rose-100',
  pending: 'bg-gold-50 text-gold-600 ring-gold-100',
};

function referenceFromParams(params: Record<string, string | undefined>): string {
  for (const name of REF_PARAMS) if (params[name]) return params[name]!.trim();
  return '';
}

/**
 * Where a payer lands after the gateway when nobody is signed in on their device. Shows only the
 * outcome, amount, UTR and card — charges are never requested, let alone shown.
 */
export function PaymentStatusCard({ params }: { params: Record<string, string | undefined> }) {
  const [token, setToken] = useState(params.t?.trim() || '');
  // A redirect token stands in for the reference; never fall back to a stale one then.
  const [reference, setReference] = useState(() => (params.t ? '' : referenceFromParams(params)));
  const [typed, setTyped] = useState(reference);
  const status = usePaymentStatus({ token, reference });

  // With neither in the address, try the last reference generated in this browser.
  useEffect(() => {
    if (token || reference) return;
    try {
      const last = localStorage.getItem(LAST_REFERENCE_KEY);
      /* eslint-disable react-hooks/set-state-in-effect -- syncing from localStorage after mount */
      if (last) {
        setReference(last);
        setTyped(last);
      }
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch {
      /* storage unavailable */
    }
    // Only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = typed.trim();
    if (!next) return;
    rememberReference(next);
    setToken('');
    setReference(next);
  };

  const data = status.data;
  const Icon = data ? ICONS[data.outcome] : SearchCheck;
  const rows = statusRows(data);

  return (
    <div className="w-full max-w-md animate-rise rounded-3xl border border-slate-200/70 bg-white p-7 text-center shadow-lift">
      <span className={cn('mx-auto grid size-16 place-items-center rounded-2xl ring-1', data ? TONES[data.outcome] : 'bg-brand-50 text-brand-600 ring-brand-100')}>
        <Icon className={cn('size-8', status.isFetching && !data && 'animate-pulse')} />
      </span>
      <h1 className="mt-5 text-[22px] font-extrabold text-ink-900">{data ? OUTCOME_TITLES[data.outcome] : status.isFetching ? 'Checking your payment…' : 'Check payment status'}</h1>
      <p className="mt-1.5 text-[13.5px] text-slate-500">{data ? data.message : status.isFetching ? 'One moment.' : 'Enter the reference number of your payment.'}</p>

      {status.isError && <Alert tone="danger" className="mt-5 text-left">{status.error.message}</Alert>}

      {rows.length > 0 && (
        <dl className="mt-6 divide-y divide-slate-100 rounded-2xl bg-slate-50 px-4 text-left">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 py-3">
              <dt className="text-[12.5px] font-semibold text-slate-500">{label}</dt>
              <dd className="text-[13.5px] font-bold break-all text-ink-900 tabular">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {data?.outcome === 'pending' && (
        <Button variant="secondary" className="mt-5" onClick={() => status.refetch()} loading={status.isFetching}>
          <RefreshCw className="size-4" /> Check again
        </Button>
      )}

      {!status.isFetching && (!data || status.isError) && (
        <form onSubmit={submit} className="mt-6 flex gap-2">
          <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Reference number" aria-label="Reference number" />
          <Button type="submit" className="h-11">
            Check
          </Button>
        </form>
      )}
    </div>
  );
}

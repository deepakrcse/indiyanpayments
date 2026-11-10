'use client';

import { useEffect, useEffectEvent, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock3, CreditCard, Search, SearchX, Wallet, WalletCards, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { features } from '@/config/features';
import { routes } from '@/config/routes';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/field';
import { LAST_REFERENCE_KEY } from './saved-payers';
import { OUTCOME_TITLES, statusRows, usePaymentStatus } from './use-payment-status';

const REDIRECT_SECONDS = 10;

const DESTINATIONS = [
  { href: routes.gateway, label: 'Card collection', icon: CreditCard },
  { href: routes.wallet, label: 'Wallet ledger', icon: Wallet },
  { href: routes.cardBills, label: 'Card bills', icon: WalletCards, off: features.payOutDisabled },
].filter((d) => !d.off);

const ICONS = { success: CheckCircle2, failed: XCircle, pending: Clock3 };
const TONES = { success: 'bg-jade-50 text-jade-600', failed: 'bg-rose-50 text-rose-600', pending: 'bg-gold-50 text-gold-600' };

/**
 * The result of the payment a payer just came back from, over the wallet page. Once the result is
 * final a 10-second countdown takes them back to card collection; "Stay here" or closing stops it.
 * `onSuccess` fires once when the payment is confirmed, so the page can reload the balance.
 */
export function PaymentResultDialog({ token, onSuccess, onDone }: { token: string; onSuccess: () => void; onDone: () => void }) {
  const router = useRouter();
  // If the return link cannot be matched, the payment can still be checked by its reference —
  // pre-filled with the last one created in this browser (the counter usually makes the link).
  const [reference, setReference] = useState<string | null>(null);
  const [typed, setTyped] = useState(() => {
    try {
      return typeof window === 'undefined' ? '' : (localStorage.getItem(LAST_REFERENCE_KEY) ?? '');
    } catch {
      return '';
    }
  });
  const status = usePaymentStatus(reference ? { reference } : { token });
  const lookupFailed = status.isError;
  const checkByReference = (e: FormEvent) => {
    e.preventDefault();
    const ref = typed.trim();
    if (ref) setReference(ref);
  };
  const [open, setOpen] = useState(true);
  const [counting, setCounting] = useState(true);
  const [seconds, setSeconds] = useState(REDIRECT_SECONDS);
  const notified = useRef(false);

  const outcome = status.data?.outcome;
  const final = outcome === 'success' || outcome === 'failed';
  const fireSuccess = useEffectEvent(onSuccess);
  const goToCollect = useEffectEvent(() => router.push(routes.gateway));

  useEffect(() => {
    if (outcome === 'success' && !notified.current) {
      notified.current = true;
      fireSuccess();
    }
  }, [outcome]);

  useEffect(() => {
    if (!open || !final || !counting) return undefined;
    if (seconds <= 0) {
      goToCollect();
      return undefined;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [open, final, counting, seconds]);

  const close = () => {
    setCounting(false);
    setOpen(false);
    onDone();
  };

  const Icon = outcome ? ICONS[outcome] : lookupFailed ? SearchX : Clock3;
  const rows = statusRows(status.data, true);

  return (
    <Dialog open={open} onClose={close} size="sm" hideClose>
      <div className="text-center">
        <span className={cn('mx-auto mt-2 grid size-16 place-items-center rounded-2xl', outcome ? TONES[outcome] : lookupFailed ? 'bg-gold-50 text-gold-600' : 'bg-brand-50 text-brand-600')}>
          <Icon className={cn('size-8', status.isFetching && !outcome && 'animate-pulse')} />
        </span>
        <h2 className="mt-4 text-[19px] font-extrabold text-ink-900">{outcome ? OUTCOME_TITLES[outcome] : lookupFailed ? "We couldn't find this payment automatically" : 'Checking your payment…'}</h2>
        <p className="mt-1 text-[13px] text-slate-500">{status.isError ? status.error.message : (status.data?.message ?? 'One moment.')}</p>

        {lookupFailed && (
          <form onSubmit={checkByReference} className="mt-4 flex gap-2 text-left">
            <Input
              aria-label="Payment reference number"
              placeholder="Reference number, e.g. NPPG013620"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="font-mono"
              autoFocus
            />
            <Button type="submit" loading={status.isFetching} disabled={!typed.trim()}>
              <Search className="size-4" /> Check
            </Button>
          </form>
        )}

        {rows.length > 0 && (
          <dl className="mt-5 divide-y divide-slate-100 rounded-2xl bg-slate-50 px-4 text-left">
            {rows.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3 py-2.5">
                <dt className="text-[12.5px] text-slate-500">{label}</dt>
                <dd className="text-[13px] font-bold break-all text-ink-900 tabular">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        <p className="mt-5 text-[11.5px] font-bold tracking-wider text-slate-400 uppercase">Where to next?</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {DESTINATIONS.map(({ href, label, icon: DIcon }) => (
            <button
              key={href}
              type="button"
              onClick={() => (href === routes.wallet ? close() : router.push(href))}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200 px-2 py-3 text-[12px] font-semibold text-ink-800 transition hover:border-brand-300 hover:bg-brand-50"
            >
              <DIcon className="size-4.5 text-brand-600" />
              {label}
            </button>
          ))}
        </div>

        {final && counting ? (
          <p className="mt-4 text-[12.5px] text-slate-500">
            Taking you to card collection in <strong className="text-ink-900 tabular">{seconds}s</strong> ·{' '}
            <button type="button" className="font-bold text-brand-600 hover:underline" onClick={() => setCounting(false)}>
              Stay here
            </button>
          </p>
        ) : (
          <Button variant="ghost" size="sm" className="mt-3" onClick={close}>
            Close
          </Button>
        )}
      </div>
    </Dialog>
  );
}

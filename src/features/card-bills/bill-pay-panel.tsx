'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CalendarClock, CheckCircle2 } from 'lucide-react';
import { api, errorMessage } from '@/lib/api/client';
import { cn } from '@/lib/cn';
import { daysUntil } from '@/lib/dates';
import { calendarDate, rupees } from '@/lib/format';
import { sanitizeAmount } from '@/lib/validation/patterns';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/feedback';
import { useMoneyMoved } from '@/features/wallet/use-wallet';
import type { Biller, BillPaymentResult, BillSummary } from '@/types/bbps';
import { BillerAvatar } from './biller-avatar';

type Choice = 'total' | 'minimum' | 'other';

function dueChip(dueDate: string | null) {
  const days = daysUntil(dueDate);
  if (days == null) return null;
  const text = days < 0 ? `Overdue by ${-days} day${days === -1 ? '' : 's'}` : days === 0 ? 'Due today' : `${days} day${days === 1 ? '' : 's'} left`;
  const tone = days < 0 ? 'bg-rose-50 text-rose-700' : days <= 3 ? 'bg-gold-50 text-gold-600' : 'bg-jade-50 text-jade-700';
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold', tone)}>
      <CalendarClock className="size-3" /> {text}
    </span>
  );
}

/** The fetched bill on the left, what to pay and paying it on the right. */
export function BillPayPanel({
  biller,
  bill,
  cardDigits,
  onPaid,
  onEdit,
}: {
  biller: Biller;
  bill: BillSummary;
  cardDigits: string;
  onPaid: (result: BillPaymentResult) => void;
  onEdit: () => void;
}) {
  const moneyMoved = useMoneyMoved();
  const [choice, setChoice] = useState<Choice>(bill.totalDue != null ? 'total' : 'other');
  const [other, setOther] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const amount = choice === 'total' ? bill.totalDue : choice === 'minimum' ? bill.minimumDue : other === '' ? null : Number(other);
  const minPay = bill.minPayable ?? 1;
  const maxPay = bill.maxPayable;
  const amountError =
    choice !== 'other' || other === ''
      ? null
      : !Number.isFinite(amount) || (amount ?? 0) <= 0
        ? 'Enter a valid amount.'
        : (amount ?? 0) < minPay
          ? `The least you can pay is ${rupees(minPay)}.`
          : maxPay != null && (amount ?? 0) > maxPay
            ? `The most you can pay is ${rupees(maxPay)}.`
            : null;
  const canPay = amount != null && amount > 0 && !amountError;

  const pay = useMutation({
    mutationFn: (value: number) => api.post<BillPaymentResult>('/api/bbps/bills/pay', { reference: bill.reference, amount: value }),
    onSuccess: (res) => {
      moneyMoved();
      onPaid(res);
    },
    onError: (err) => {
      setNotice(errorMessage(err));
      setConfirming(false);
    },
  });

  const select = (c: Choice) => {
    setChoice(c);
    setConfirming(false);
    setNotice(null);
  };

  // Paying moves real money, so the first press only asks to confirm.
  const onPay = () => {
    if (!canPay || pay.isPending) return;
    if (!confirming) {
      setConfirming(true);
      setNotice(null);
      return;
    }
    pay.mutate(amount);
  };

  const left = canPay && bill.totalDue != null ? bill.totalDue - amount : null;

  const option = (c: Choice, title: string, sub: string, value: number | null) => (
    <button
      type="button"
      role="radio"
      aria-checked={choice === c}
      onClick={() => select(c)}
      className={cn('flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition', choice === c ? 'border-brand-500 bg-brand-50/60 ring-4 ring-brand-500/10' : 'border-slate-200 hover:border-brand-300')}
    >
      <span className={cn('grid size-5 place-items-center rounded-full border-2', choice === c ? 'border-brand-600' : 'border-slate-300')}>{choice === c && <span className="size-2.5 rounded-full bg-brand-600" />}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-bold text-ink-900">{title}</span>
        <span className="block text-[12px] text-slate-500">{sub}</span>
      </span>
      {value != null && <span className="text-[15px] font-extrabold text-ink-900 tabular">{rupees(value)}</span>}
    </button>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        {/* A card face, to confirm it is the right card. */}
        <div className="bg-aurora relative overflow-hidden rounded-3xl p-5 text-white shadow-lift">
          <div className="flex items-start justify-between">
            <span className="text-[13px] font-bold">{biller.billerName}</span>
            <BillerAvatar billerId={biller.billerId} name={biller.billerName} size={38} />
          </div>
          <span className="mt-6 block h-8 w-11 rounded-md bg-gradient-to-br from-gold-400 to-gold-600 opacity-90" aria-hidden />
          <p className="mt-4 font-mono text-[18px] tracking-[0.25em]">•••• •••• •••• {cardDigits}</p>
          <div className="mt-4 flex justify-between text-[11px]">
            <div>
              <p className="text-brand-200 uppercase">Card holder</p>
              <p className="mt-0.5 text-[13px] font-bold">{bill.customerName || '—'}</p>
            </div>
            {bill.dueDate && (
              <div className="text-right">
                <p className="text-brand-200 uppercase">Due date</p>
                <p className="mt-0.5 text-[13px] font-bold">{calendarDate(bill.dueDate)}</p>
              </div>
            )}
          </div>
        </div>

        <dl className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-4">
          {bill.totalDue != null && (
            <div className="flex items-center justify-between py-3">
              <dt className="text-[13px] text-slate-500">Total amount due</dt>
              <dd className="text-[17px] font-extrabold text-ink-900 tabular">{rupees(bill.totalDue)}</dd>
            </div>
          )}
          {bill.minimumDue != null && (
            <div className="flex items-center justify-between py-3">
              <dt className="text-[13px] text-slate-500">Minimum amount due</dt>
              <dd className="font-bold text-ink-900 tabular">{rupees(bill.minimumDue)}</dd>
            </div>
          )}
          {bill.dueDate && (
            <div className="flex items-center justify-between gap-3 py-3">
              <dt className="text-[13px] text-slate-500">Due date</dt>
              <dd className="flex items-center gap-2 font-bold text-ink-900">
                {calendarDate(bill.dueDate)} {dueChip(bill.dueDate)}
              </dd>
            </div>
          )}
          {bill.billDate && (
            <div className="flex items-center justify-between py-3">
              <dt className="text-[13px] text-slate-500">Statement date</dt>
              <dd className="font-bold text-ink-900">{calendarDate(bill.billDate)}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="space-y-3">
        <p className="text-[14px] font-bold text-ink-900">How much do you want to pay?</p>
        <div role="radiogroup" aria-label="Amount to pay" className="space-y-2">
          {bill.totalDue != null && option('total', 'Total amount due', 'Clears the full statement', bill.totalDue)}
          {bill.minimumDue != null && option('minimum', 'Minimum amount due', 'Avoids a late fee; interest applies on the rest', bill.minimumDue)}
          <div className={cn('rounded-2xl border p-3.5 transition', choice === 'other' ? 'border-brand-500 bg-brand-50/60 ring-4 ring-brand-500/10' : 'border-slate-200')}>
            <button type="button" role="radio" aria-checked={choice === 'other'} onClick={() => select('other')} className="flex w-full items-center gap-3 text-left">
              <span className={cn('grid size-5 place-items-center rounded-full border-2', choice === 'other' ? 'border-brand-600' : 'border-slate-300')}>{choice === 'other' && <span className="size-2.5 rounded-full bg-brand-600" />}</span>
              <span className="flex-1">
                <span className="block text-[13.5px] font-bold text-ink-900">Other amount</span>
                {maxPay != null && (
                  <span className="block text-[12px] text-slate-500">
                    {rupees(minPay)} – {rupees(maxPay)}
                  </span>
                )}
              </span>
            </button>
            {choice === 'other' && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
                <span className="font-bold text-slate-400">₹</span>
                <input
                  autoFocus
                  inputMode="decimal"
                  aria-label="Other amount"
                  placeholder="0.00"
                  value={other}
                  onChange={(e) => {
                    const v = sanitizeAmount(e.target.value);
                    if (v !== null) setOther(v);
                    setNotice(null);
                    setConfirming(false);
                  }}
                  className="h-11 w-full bg-transparent text-base font-bold tabular outline-none"
                />
              </div>
            )}
          </div>
        </div>
        {amountError && <p className="text-[12.5px] font-medium text-rose-600">{amountError}</p>}

        {bill.totalDue != null && (
          <dl className="rounded-2xl bg-slate-50 p-4 text-[13px]">
            <div className="flex justify-between py-1">
              <dt className="text-slate-500">Statement amount</dt>
              <dd className="font-semibold tabular">{rupees(bill.totalDue)}</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-slate-500">Paying now</dt>
              <dd className="font-semibold tabular">{canPay ? rupees(amount) : '—'}</dd>
            </div>
            <div className="mt-1 flex justify-between border-t border-slate-200 pt-2">
              <dt className="text-slate-500">{left != null && left < 0 ? 'Extra paid (as card credit)' : 'Still due after this'}</dt>
              <dd className={cn('font-bold tabular', left === 0 && 'text-jade-600')}>{left == null ? '—' : left === 0 ? `${rupees(0)} · cleared` : rupees(Math.abs(left))}</dd>
            </div>
          </dl>
        )}

        {bill.dueDate && (
          <p className="flex items-center gap-1.5 text-[12.5px] text-slate-500">
            <CalendarClock className="size-3.5" /> Pay before {calendarDate(bill.dueDate)} to avoid late payment charges.
          </p>
        )}

        {notice && <Alert tone="danger">{notice}</Alert>}
        {confirming && canPay && (
          <Alert tone="warning">
            {rupees(amount)} will be paid from your Indiyan Payments wallet to {biller.billerName} •••• {cardDigits}.
          </Alert>
        )}

        <Button size="lg" block variant={confirming ? 'success' : 'primary'} onClick={onPay} disabled={!canPay} loading={pay.isPending}>
          <CheckCircle2 className="size-4.5" />
          {!canPay ? 'Enter an amount' : confirming ? `Confirm and pay ${rupees(amount)}` : `Pay ${rupees(amount)}`}
        </Button>
        <Button variant="ghost" block onClick={() => (confirming && !pay.isPending ? setConfirming(false) : onEdit())} disabled={pay.isPending}>
          {confirming ? 'Cancel' : 'Edit card details'}
        </Button>
      </div>
    </div>
  );
}

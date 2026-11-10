import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'dark';

const tones: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  success: 'bg-jade-50 text-jade-700 ring-jade-100',
  warning: 'bg-gold-50 text-gold-600 ring-gold-100',
  danger: 'bg-rose-50 text-rose-700 ring-rose-100',
  info: 'bg-sky-50 text-sky-700 ring-sky-100',
  dark: 'bg-ink-900 text-white ring-ink-900',
};

export function Badge({ tone = 'neutral', children, className, dot = false }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide whitespace-nowrap ring-1 ring-inset', tones[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

/** Colours a payment status the same way on every screen. */
export function statusTone(status: string | null | undefined): Tone {
  const s = (status ?? '').toUpperCase();
  if (['SUCCESS', 'APPROVED', 'COMPLETED', 'CREDITED', 'ACTIVE', 'PAID'].includes(s)) return 'success';
  if (['PENDING', 'PROCESSING', 'INITIATED'].includes(s)) return 'warning';
  if (['FAILED', 'FAILURE', 'REJECTED', 'DECLINED', 'CANCELLED', 'INACTIVE'].includes(s)) return 'danger';
  return 'neutral';
}

export function StatusBadge({ status }: { status: string | null | undefined }) {
  return (
    <Badge tone={statusTone(status)} dot>
      {status ? status.toUpperCase() : '—'}
    </Badge>
  );
}

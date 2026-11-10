import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'brand' | 'jade' | 'gold' | 'rose' | 'sky' | 'ink';

const tones: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-600',
  jade: 'bg-jade-50 text-jade-600',
  gold: 'bg-gold-50 text-gold-600',
  rose: 'bg-rose-50 text-rose-600',
  sky: 'bg-sky-50 text-sky-600',
  ink: 'bg-ink-900 text-white',
};

export function StatCard({
  label,
  value,
  icon,
  tone = 'brand',
  hint,
  action,
  loading = false,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  hint?: ReactNode;
  action?: ReactNode;
  loading?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('relative flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-3 shadow-card', className)}>
      {icon && <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl [&_svg]:size-4.5', tones[tone])}>{icon}</span>}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{label}</p>
        {loading ? <div className="skeleton mt-1.5 h-6 w-28 rounded-lg" /> : <p className="truncate text-[18px] leading-tight font-extrabold tabular text-ink-900">{value}</p>}
        {hint && <p className="mt-0.5 text-[12px] text-slate-500">{hint}</p>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}

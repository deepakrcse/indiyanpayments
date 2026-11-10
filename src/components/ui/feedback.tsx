import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

export function EmptyState({ icon, title, children, action, className }: { icon?: ReactNode; title: ReactNode; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-8 text-center', className)}>
      {icon && <span className="mb-3 grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-500 [&_svg]:size-5">{icon}</span>}
      <p className="text-[14px] font-bold text-ink-900">{title}</p>
      {children && <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-slate-500">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

type Tone = 'info' | 'success' | 'warning' | 'danger';
const toneStyles: Record<Tone, { box: string; Icon: typeof Info }> = {
  info: { box: 'border-brand-100 bg-brand-50/70 text-brand-800', Icon: Info },
  success: { box: 'border-jade-100 bg-jade-50 text-jade-700', Icon: CheckCircle2 },
  warning: { box: 'border-gold-100 bg-gold-50 text-gold-600', Icon: AlertTriangle },
  danger: { box: 'border-rose-100 bg-rose-50 text-rose-700', Icon: XCircle },
};

export function Alert({ tone = 'info', title, children, className, action }: { tone?: Tone; title?: ReactNode; children?: ReactNode; className?: string; action?: ReactNode }) {
  const { box, Icon } = toneStyles[tone];
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-2xl border px-4 py-3 text-[13px] leading-relaxed', box, className)}>
      <Icon className="mt-0.5 size-4.5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="font-bold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5 opacity-90')}>{children}</div>}
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-xl', className)} aria-hidden />;
}

export function LoadingRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2.5 p-5" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-11" />
      ))}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cn('inline-block size-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600', className)} aria-label="Loading" />;
}

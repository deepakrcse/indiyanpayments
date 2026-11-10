import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** A scrolling table shell: sticky header, horizontal scroll on narrow screens. */
export function Table({ className, children, maxHeight }: { className?: string; children: ReactNode; maxHeight?: string }) {
  return (
    <div className={cn('scrollbar-thin overflow-auto', className)} style={maxHeight ? { maxHeight } : undefined}>
      <table className="w-full border-separate border-spacing-0 text-[13px]">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="sticky top-0 z-10">{children}</thead>;
}

export function TH({ className, align = 'left', ...props }: ThHTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'right' | 'center' }) {
  return (
    <th
      scope="col"
      className={cn(
        'border-b border-slate-200 bg-slate-50/95 px-4 py-2.5 text-[11px] font-bold tracking-wider whitespace-nowrap text-slate-500 uppercase backdrop-blur',
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left',
        className,
      )}
      {...props}
    />
  );
}

export function TR({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('transition-colors hover:bg-brand-50/40 [&:last-child>td]:border-b-0', className)} {...props} />;
}

export function TD({ className, align = 'left', ...props }: TdHTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'right' | 'center' }) {
  return (
    <td
      className={cn(
        'border-b border-slate-100 px-4 py-3 align-middle text-slate-700',
        align === 'right' ? 'text-right tabular' : align === 'center' ? 'text-center' : 'text-left',
        className,
      )}
      {...props}
    />
  );
}

/** A primary value with a muted second line beneath it. */
export function Stacked({ primary, secondary, className }: { primary: ReactNode; secondary?: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="font-semibold text-ink-900">{primary || '—'}</div>
      {secondary ? <div className="mt-0.5 text-[12px] text-slate-500">{secondary}</div> : null}
    </div>
  );
}

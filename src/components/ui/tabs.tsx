'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** A pill-shaped segmented control. */
export function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  className,
  label,
}: {
  items: { value: T; label: ReactNode; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  label?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={cn('scrollbar-thin inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1', className)}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-[13px] font-semibold whitespace-nowrap transition',
              active ? 'bg-white text-ink-900 shadow-sm' : 'text-slate-500 hover:text-ink-800',
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className={cn('rounded-full px-1.5 text-[11px] tabular', active ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-500')}>{item.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

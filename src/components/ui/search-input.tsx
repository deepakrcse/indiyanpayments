'use client';

import { Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';

/** A filter box for lists already on screen — narrows as you type, no request. */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search',
  className,
  size = 'md',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
        className={cn(
          'w-full rounded-xl border border-slate-200 bg-white pr-9 pl-10 text-sm text-ink-900 outline-none placeholder:text-slate-400',
          'transition hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12 [&::-webkit-search-cancel-button]:hidden',
          size === 'sm' ? 'h-10' : 'h-11',
        )}
      />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label="Clear search" className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

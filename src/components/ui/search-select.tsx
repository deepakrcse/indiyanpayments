'use client';

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SearchOption {
  value: string;
  label: string;
  hint?: string;
}

/**
 * A dropdown you can type into: the list narrows to whatever contains the text (label or hint),
 * labels that start with it first. `value` is the chosen option's value ('' for none); editing
 * the text clears the choice, so the page never holds a choice the box no longer shows.
 */
export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = 'Type to search…',
  loading = false,
  emptyText = 'Nothing matches.',
  id,
  invalid,
  size = 'md',
}: {
  options: SearchOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  emptyText?: string;
  id?: string;
  invalid?: boolean;
  size?: 'sm' | 'md';
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value);
  const text = draft ?? selected?.label ?? '';

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
      setDraft(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const matches = useMemo(() => {
    const needle = (draft ?? '').trim().toLowerCase();
    if (!needle) return options;
    return options
      .filter((o) => `${o.label} ${o.hint ?? ''}`.toLowerCase().includes(needle))
      .sort((a, b) => Number(b.label.toLowerCase().startsWith(needle)) - Number(a.label.toLowerCase().startsWith(needle)));
  }, [options, draft]);

  useEffect(() => {
    listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const choose = (o: SearchOption) => {
    onChange(o.value);
    setDraft(null);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && open) {
      e.preventDefault(); // never submit the surrounding form while picking
      if (matches[active]) choose(matches[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setDraft(null);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-invalid={invalid}
        autoComplete="off"
        disabled={loading}
        value={loading && !selected && draft === null ? '' : text}
        placeholder={loading ? 'Loading…' : placeholder}
        onFocus={(e) => {
          setOpen(true);
          e.target.select();
        }}
        onChange={(e) => {
          setDraft(e.target.value);
          setActive(0);
          setOpen(true);
          if (value) onChange('');
        }}
        onKeyDown={onKeyDown}
        className={cn(
          'w-full rounded-xl border border-slate-200 bg-white pr-10 pl-10 text-sm text-ink-900 transition outline-none placeholder:text-slate-400',
          'hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12 disabled:bg-slate-50 aria-invalid:border-rose-400',
          size === 'sm' ? 'h-10' : 'h-11',
        )}
      />
      <ChevronDown className={cn('pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-slate-400 transition-transform', open && 'rotate-180')} />

      {open && (
        <ul ref={listRef} id={listId} role="listbox" className="scrollbar-thin absolute z-50 mt-1.5 max-h-64 w-full animate-pop overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lift">
          {matches.length === 0 && <li className="px-3 py-2.5 text-[13px] text-slate-500">{emptyText}</li>}
          {matches.map((o, i) => {
            const isSelected = o.value === value;
            return (
              <li
                key={o.value}
                role="option"
                aria-selected={isSelected}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(o);
                }}
                onMouseEnter={() => setActive(i)}
                className={cn('flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2', i === active ? 'bg-brand-50' : '')}
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-semibold text-ink-900">{o.label}</span>
                  {o.hint && <span className="block truncate text-[12px] text-slate-500">{o.hint}</span>}
                </span>
                {isSelected && <Check className="size-4 shrink-0 text-brand-600" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

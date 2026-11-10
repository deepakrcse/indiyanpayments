'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { DateField } from './date-field';
import { Label } from './field';
import { QUICK_RANGES, quickRange, todayIso } from '@/lib/dates';

/** The ranges shown as buttons; the rest live under "More" — each range appears exactly once. */
const PINNED = QUICK_RANGES.slice(0, 4);
const MORE = QUICK_RANGES.slice(4);

const short = (label: string) => label.replace('Last ', '').replace(' days', 'd');
/** On phones the More trigger names the chosen month range in short, so the row fits the card. */
const phoneLabel = (label: string) => label.replace(' month', ' mo.');
const isActive = (key: string, fromDate: string, toDate: string) => {
  const r = quickRange(key);
  return Boolean(r && r.from === fromDate && r.to === toDate);
};

/**
 * "More" ranges in a small menu of our own (not the browser's select): only the ranges that are not
 * already buttons, the chosen one ticked and named on the trigger. Positioned against the screen,
 * so a card's overflow never clips it; closes on outside click, Escape or scroll.
 */
function MoreRanges({ fromDate, toDate, onPick }: { fromDate: string; toDate: string; onPick: (key: string) => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const chosen = MORE.find((q) => isActive(q.key, fromDate, toDate));

  useEffect(() => {
    if (!open) return undefined;
    const close = () => setOpen(false);
    const onDown = (e: MouseEvent) => {
      if (!menu.current?.contains(e.target as Node) && !trigger.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        trigger.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    // Focus the chosen item (or the first) once the menu is on screen.
    const t = setTimeout(() => menu.current?.querySelector<HTMLButtonElement>('[aria-checked="true"], button')?.focus(), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const toggle = () => {
    if (open) return setOpen(false);
    const r = trigger.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    setOpen(true);
  };

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = [...(menu.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])];
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
  };

  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className={cn(
          'inline-flex h-full flex-auto items-center justify-center gap-1 rounded-lg px-1.5 text-[12px] font-semibold whitespace-nowrap transition sm:flex-none sm:px-2.5',
          chosen ? 'bg-brand-600 text-white' : open ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-brand-50 hover:text-brand-700',
        )}
      >
        {chosen ? (
          <>
            <span className="sm:hidden">{phoneLabel(chosen.label)}</span>
            <span className="max-sm:hidden">{chosen.label}</span>
          </>
        ) : (
          'More'
        )}
        <ChevronDown className={cn('size-3.5 transition-transform duration-200', open && 'rotate-180', chosen && 'max-sm:hidden')} />
      </button>
      {open && pos && (
        <div
          ref={menu}
          id={menuId}
          role="menu"
          aria-label="More ranges"
          onKeyDown={onMenuKey}
          style={{ top: pos.top, right: pos.right }}
          className="fixed z-150 w-44 origin-top-right animate-pop rounded-xl border border-slate-200 bg-white p-1 shadow-lift"
        >
          {MORE.map((q) => {
            const active = isActive(q.key, fromDate, toDate);
            return (
              <button
                key={q.key}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  onPick(q.key);
                  setOpen(false);
                  trigger.current?.focus();
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] font-semibold outline-none transition',
                  active ? 'bg-brand-50 text-brand-700' : 'text-ink-800 hover:bg-slate-50 focus-visible:bg-slate-50',
                )}
              >
                {q.label}
                {active && <Check className="size-4 text-brand-600" />}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

/**
 * From / To plus quick ranges that set both: Today, Yesterday, 7d and 30d as buttons, and the
 * longer ranges (This month, Last month) under "More". Only the values change — the page's own
 * Search still runs the report.
 */
export function DateRangeFields({
  fromDate,
  toDate,
  onChange,
}: {
  fromDate: string;
  toDate: string;
  onChange: (range: { fromDate: string; toDate: string }) => void;
}) {
  const pick = (key: string) => {
    const r = quickRange(key);
    if (r) onChange({ fromDate: r.from, toDate: r.to });
  };
  return (
    <>
      <div className="min-w-36">
        <Label>From</Label>
        <DateField size="sm" value={fromDate} onChange={(v) => onChange({ fromDate: v, toDate })} max={toDate} aria-label="From date" />
      </div>
      <div className="min-w-36">
        <Label>To</Label>
        <DateField size="sm" value={toDate} onChange={(v) => onChange({ fromDate, toDate: v })} min={fromDate} max={todayIso()} aria-label="To date" />
      </div>
      <div className="max-sm:w-full">
        <Label>Quick range</Label>
        <div className="flex h-10 items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-1 sm:gap-1">
          {PINNED.map((q) => {
            const active = isActive(q.key, fromDate, toDate);
            return (
              <button
                key={q.key}
                type="button"
                onClick={() => pick(q.key)}
                aria-pressed={active}
                title={q.label}
                className={cn('h-full flex-auto rounded-lg px-1.5 text-[12px] font-semibold whitespace-nowrap transition sm:flex-none sm:px-2.5', active ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-brand-50 hover:text-brand-700')}
              >
                {short(q.label)}
              </button>
            );
          })}
          <MoreRanges fromDate={fromDate} toDate={toDate} onPick={pick} />
        </div>
      </div>
    </>
  );
}

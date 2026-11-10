'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { addDays, fromIso, MONTHS, MONTHS_LONG, toIso, todayIso } from '@/lib/dates';

const POP_W = 312;
const POP_H = 380;
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const shown = (iso: string) => fromIso(iso)?.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) ?? null;

/**
 * A date box that opens a calendar. The title opens a month grid and the year there opens a year
 * list, so any date is a few clicks away. Neighbouring months' days are faded, Today is one tap,
 * arrow keys and PageUp/PageDown move around. Value and onChange use 'YYYY-MM-DD'.
 */
export function DateField({
  value,
  onChange,
  min,
  max,
  minYear,
  maxYear,
  placeholder = 'Select date',
  disabled = false,
  size = 'md',
  id,
  invalid,
  'aria-label': ariaLabel,
}: {
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
  minYear?: number;
  maxYear?: number;
  placeholder?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  id?: string;
  invalid?: boolean;
  'aria-label'?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'days' | 'months' | 'years'>('days');
  const [view, setView] = useState({ year: 0, month: 0 });
  const [focusIso, setFocusIso] = useState<string | null>(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const today = todayIso();
  const lowYear = minYear ?? (min ? fromIso(min)?.getFullYear() : undefined) ?? 2000;
  const highYear = maxYear ?? (max ? fromIso(max)?.getFullYear() : undefined) ?? new Date().getFullYear() + 1;
  const years = useMemo(() => Array.from({ length: highYear - lowYear + 1 }, (_, i) => lowYear + i), [lowYear, highYear]);
  const inRange = useCallback((iso: string) => (!min || iso >= min) && (!max || iso <= max), [min, max]);

  const openPicker = () => {
    if (disabled || !triggerRef.current) return;
    const start = fromIso(value) ?? fromIso(today)!;
    setView({ year: start.getFullYear(), month: start.getMonth() });
    setFocusIso(toIso(start));
    setMode('days');
    const rect = triggerRef.current.getBoundingClientRect();
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - POP_W - 8));
    const below = rect.bottom + 6 + POP_H < window.innerHeight;
    setPos({ left, top: below ? rect.bottom + 6 : Math.max(8, rect.top - 6 - POP_H) });
    setOpen(true);
  };

  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  const choose = (iso: string) => {
    if (!inRange(iso)) return;
    onChange(iso);
    close();
  };

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      close(false);
    };
    // Placed from where the box was when it opened: close rather than float in the wrong place.
    const onMove = (e: Event) => {
      if (!popRef.current?.contains(e.target as Node)) close(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (mode !== 'days') setMode('days');
      else close();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [open, mode, close]);

  useEffect(() => {
    if (open && mode === 'days' && focusIso) popRef.current?.querySelector<HTMLElement>(`[data-iso="${focusIso}"]`)?.focus();
  }, [open, mode, focusIso, view]);

  useEffect(() => {
    if (open && mode === 'years') popRef.current?.querySelector('[data-selected-year]')?.scrollIntoView({ block: 'center' });
  }, [open, mode]);

  const monthOutside = (year: number, month: number) => {
    const first = toIso(new Date(year, month, 1));
    const last = toIso(new Date(year, month + 1, 0));
    return Boolean((max && first > max) || (min && last < min));
  };
  const keepDay = (year: number, month: number) =>
    toIso(new Date(year, month, Math.min(fromIso(focusIso ?? '')?.getDate() ?? 1, new Date(year, month + 1, 0).getDate())));

  const goMonth = (delta: number) => {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
    setFocusIso(keepDay(d.getFullYear(), d.getMonth()));
  };

  // Six full weeks every time, so the popover never changes height between months.
  const first = new Date(view.year, view.month, 1);
  const gridStart = addDays(first, -first.getDay());
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = addDays(gridStart, i);
    return { iso: toIso(d), day: d.getDate(), outside: d.getMonth() !== view.month };
  });

  const onGridKey = (e: KeyboardEvent) => {
    const step = ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 } as Record<string, number>)[e.key];
    if (step !== undefined && focusIso) {
      e.preventDefault();
      const next = toIso(addDays(fromIso(focusIso)!, step));
      if (!inRange(next)) return;
      const d = fromIso(next)!;
      setView({ year: d.getFullYear(), month: d.getMonth() });
      setFocusIso(next);
    } else if (e.key === 'PageUp' || e.key === 'PageDown') {
      e.preventDefault();
      goMonth(e.key === 'PageUp' ? -1 : 1);
    }
  };

  const prevOutside = view.month === 0 ? monthOutside(view.year - 1, 11) : monthOutside(view.year, view.month - 1);
  const nextOutside = view.month === 11 ? monthOutside(view.year + 1, 0) : monthOutside(view.year, view.month + 1);
  const label = shown(value);

  const navBtn = 'grid size-8 place-items-center rounded-lg text-slate-500 transition hover:bg-brand-50 hover:text-brand-700 disabled:opacity-30';
  const titleBtn = 'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-bold text-ink-900 transition hover:bg-brand-50';

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => (open ? close(false) : openPicker())}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        data-invalid={invalid || undefined}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-left text-sm transition outline-none',
          'hover:border-slate-300 focus-visible:border-brand-500 focus-visible:ring-4 focus-visible:ring-brand-500/12 disabled:bg-slate-50',
          'data-invalid:border-rose-400',
          size === 'sm' ? 'h-10 min-w-36' : 'h-11',
          label ? 'text-ink-900' : 'text-slate-400',
        )}
      >
        <span className="truncate">{label ?? placeholder}</span>
        <CalendarDays className="size-4 shrink-0 text-slate-400" />
      </button>

      {open &&
        createPortal(
          <div
            ref={popRef}
            role="dialog"
            aria-label="Choose a date"
            className="fixed z-300 animate-pop rounded-2xl border border-slate-200 bg-white p-3 shadow-pop"
            style={{ left: pos.left, top: pos.top, width: POP_W }}
          >
            {mode === 'days' && (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <button type="button" className={navBtn} onClick={() => goMonth(-1)} disabled={prevOutside} aria-label="Previous month">
                    <ChevronLeft className="size-4" />
                  </button>
                  <button type="button" className={titleBtn} onClick={() => setMode('months')}>
                    {MONTHS_LONG[view.month]} {view.year} <ChevronDown className="size-3.5" />
                  </button>
                  <button type="button" className={navBtn} onClick={() => goMonth(1)} disabled={nextOutside} aria-label="Next month">
                    <ChevronRight className="size-4" />
                  </button>
                </div>
                <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-bold text-slate-400" aria-hidden>
                  {WEEKDAYS.map((d) => (
                    <span key={d} className="py-1">
                      {d}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0.5" onKeyDown={onGridKey} role="grid">
                  {cells.map(({ iso, day, outside }) => {
                    const selected = iso === value;
                    return (
                      <button
                        key={iso}
                        type="button"
                        data-iso={iso}
                        tabIndex={iso === focusIso ? 0 : -1}
                        disabled={!inRange(iso)}
                        onClick={() => choose(iso)}
                        aria-pressed={selected}
                        aria-label={fromIso(iso)!.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        className={cn(
                          'grid h-9 place-items-center rounded-lg text-[13px] font-semibold tabular transition',
                          'disabled:cursor-not-allowed disabled:opacity-25',
                          selected ? 'bg-brand-600 text-white shadow-sm' : 'hover:bg-brand-50 hover:text-brand-700',
                          !selected && outside && 'text-slate-300',
                          !selected && !outside && 'text-ink-800',
                          !selected && iso === today && 'ring-1 ring-brand-400 ring-inset',
                        )}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="mt-2 w-full rounded-lg py-2 text-[13px] font-bold text-brand-600 transition hover:bg-brand-50 disabled:opacity-40"
                  onClick={() => choose(today)}
                  disabled={!inRange(today)}
                >
                  Today
                </button>
              </>
            )}

            {mode === 'months' && (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <button type="button" className={navBtn} onClick={() => setView((v) => ({ ...v, year: Math.max(lowYear, v.year - 1) }))} disabled={view.year <= lowYear} aria-label="Previous year">
                    <ChevronLeft className="size-4" />
                  </button>
                  <button type="button" className={titleBtn} onClick={() => setMode('years')}>
                    {view.year} <ChevronDown className="size-3.5" />
                  </button>
                  <button type="button" className={navBtn} onClick={() => setView((v) => ({ ...v, year: Math.min(highYear, v.year + 1) }))} disabled={view.year >= highYear} aria-label="Next year">
                    <ChevronRight className="size-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {MONTHS.map((name, i) => (
                    <button
                      key={name}
                      type="button"
                      disabled={monthOutside(view.year, i)}
                      onClick={() => {
                        setView((v) => ({ ...v, month: i }));
                        setFocusIso(keepDay(view.year, i));
                        setMode('days');
                      }}
                      className={cn(
                        'h-12 rounded-xl text-[13px] font-semibold transition disabled:opacity-25',
                        i === view.month ? 'bg-brand-600 text-white' : 'bg-slate-50 text-ink-800 hover:bg-brand-50',
                      )}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </>
            )}

            {mode === 'years' && (
              <>
                <p className="mb-2 text-center text-sm font-bold text-ink-900">Select year</p>
                <div className="scrollbar-thin grid max-h-72 grid-cols-4 gap-1.5 overflow-y-auto pr-1">
                  {years.map((y) => (
                    <button
                      key={y}
                      type="button"
                      data-selected-year={y === view.year ? '' : undefined}
                      onClick={() => {
                        setView((v) => ({ ...v, year: y }));
                        setMode('months');
                      }}
                      className={cn('h-10 rounded-lg text-[13px] font-semibold tabular transition', y === view.year ? 'bg-brand-600 text-white' : 'text-ink-800 hover:bg-brand-50')}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

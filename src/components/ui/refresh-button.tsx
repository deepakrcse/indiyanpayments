'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';

type Phase = 'idle' | 'spinning' | 'done' | 'failed';

/** A refetch result from React Query counts as a failure when it says so; anything thrown does too. */
const failed = (result: unknown) => typeof result === 'object' && result !== null && 'isError' in result && (result as { isError: unknown }).isError === true;

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Refresh with a considered motion:
 *  1. click   — the icon starts turning at once (never a dead click), and the button locks;
 *  2. loading — it keeps turning while the request runs;
 *  3. landing — it never snaps back mid-turn: it finishes the turn it is on, so even a very fast
 *               reload reads as one full, deliberate rotation;
 *  4. result  — a green tick pops in for a moment ("Updated"), or the icon gives a small shake on
 *               failure; then it settles back to the refresh icon.
 * Background reloads never animate it — only a press does. With reduced motion there is no spin,
 * just the tick. Screen readers hear "Refreshing…" then "Updated".
 */
export function RefreshButton({
  onRefresh,
  label,
  title = 'Refresh',
  variant = 'ghost',
  className,
  iconClassName,
}: {
  onRefresh: () => unknown;
  /** Visible text beside the icon (e.g. "Refresh"); omit for an icon-only button. */
  label?: string;
  title?: string;
  /** ghost: plain icon on light surfaces · onDark: on navy · outline: bordered button with label · gold: pending-row action */
  variant?: 'ghost' | 'onDark' | 'outline' | 'gold';
  className?: string;
  iconClassName?: string;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const pending = useRef(false);
  const outcome = useRef<'done' | 'failed'>('done');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const settle = (result: 'done' | 'failed') => {
    setPhase(result);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setPhase('idle'), result === 'done' ? 1100 : 900);
  };

  const run = async () => {
    if (phase === 'spinning') return;
    if (timer.current) clearTimeout(timer.current);
    pending.current = true;
    setPhase('spinning');
    let ok = true;
    try {
      ok = !failed(await onRefresh());
    } catch {
      ok = false;
    }
    pending.current = false;
    outcome.current = ok ? 'done' : 'failed';
    // Without motion there is no turn to finish — show the result straight away.
    if (reducedMotion()) settle(outcome.current);
  };

  // Each completed turn: if the request is over, stop here — exactly on a full rotation.
  const onTurn = () => {
    if (!pending.current) settle(outcome.current);
  };

  const spinning = phase === 'spinning';
  const done = phase === 'done';
  const styles = {
    ghost: 'size-8 justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-brand-600',
    onDark: 'size-8 justify-center rounded-lg text-brand-100 hover:bg-white/10 hover:text-white',
    gold: 'size-8 justify-center rounded-lg text-gold-600 hover:bg-gold-50',
    outline: 'h-9 gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-ink-800 shadow-card hover:border-brand-300 hover:bg-brand-50/50',
  }[variant];

  return (
    <button
      type="button"
      onClick={run}
      disabled={spinning}
      title={title}
      aria-label={label ? undefined : title}
      aria-busy={spinning}
      className={cn(
        'group inline-flex shrink-0 items-center transition-[background-color,color,border-color,transform] duration-200 active:scale-95 disabled:cursor-progress',
        styles,
        done && variant !== 'onDark' && 'text-jade-600 hover:text-jade-600',
        done && variant === 'onDark' && 'text-jade-500 hover:text-jade-500',
        className,
      )}
    >
      <span className={cn('relative grid size-4 place-items-center', iconClassName, phase === 'failed' && 'animate-shake text-rose-500')}>
        {done ? (
          <Check className="size-4 animate-pop" strokeWidth={2.6} aria-hidden />
        ) : (
          <RefreshCw
            onAnimationIteration={onTurn}
            className={cn('size-4 transition-transform duration-300', spinning ? 'animate-refresh-spin motion-reduce:animate-none' : 'group-hover:rotate-45')}
            aria-hidden
          />
        )}
      </span>
      {label && <span>{done ? 'Updated' : label}</span>}
      <span className="sr-only" aria-live="polite">
        {spinning ? 'Refreshing…' : done ? 'Updated' : phase === 'failed' ? 'Could not refresh' : ''}
      </span>
    </button>
  );
}

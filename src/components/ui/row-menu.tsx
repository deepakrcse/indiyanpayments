'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface RowAction {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  danger?: boolean;
  onSelect: () => void;
}

const WIDTH = 200;

/** A "more" button with a menu of row actions, drawn in a portal so a scrolling table can't clip it. */
export function RowMenu({ actions, label = 'More actions' }: { actions: RowAction[]; label?: string }) {
  const btn = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  const open = () => {
    const rect = btn.current!.getBoundingClientRect();
    const height = actions.length * 40 + 12;
    const below = rect.bottom + 6 + height <= window.innerHeight;
    setPos({
      left: Math.max(8, Math.min(rect.right - WIDTH, window.innerWidth - WIDTH - 8)),
      top: below ? rect.bottom + 6 : Math.max(8, rect.top - 6 - height),
    });
  };

  useEffect(() => {
    if (!pos) return undefined;
    const close = () => setPos(null);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [pos]);

  return (
    <>
      <button
        ref={btn}
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={Boolean(pos)}
        onClick={() => (pos ? setPos(null) : open())}
        className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-brand-300 hover:text-brand-600"
      >
        <MoreHorizontal className="size-4" />
      </button>
      {pos &&
        createPortal(
          <>
            <div className="fixed inset-0 z-150" onClick={() => setPos(null)} aria-hidden />
            <div role="menu" className="fixed z-151 animate-pop rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lift" style={{ left: pos.left, top: pos.top, width: WIDTH }}>
              {actions.map(({ label: text, icon: Icon, danger, onSelect }) => (
                <button
                  key={text}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setPos(null);
                    onSelect();
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-semibold transition',
                    danger ? 'text-rose-600 hover:bg-rose-50' : 'text-ink-800 hover:bg-brand-50',
                  )}
                >
                  {Icon && <Icon className="size-4" />}
                  {text}
                </button>
              ))}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}

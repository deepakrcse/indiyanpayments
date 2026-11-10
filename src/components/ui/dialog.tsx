'use client';

import { useEffect, useEffectEvent, useId, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl', '2xl': 'max-w-4xl', full: 'max-w-6xl' } as const;

const noSubscribe = () => () => {};

/**
 * False on the server and while the page hydrates, true afterwards. A dialog that is already open
 * when the page loads (e.g. the payment result) must render nothing until then, exactly like the
 * server did — otherwise React reports a hydration mismatch.
 */
const useHydrated = () =>
  useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );

/**
 * A centred dialog rendered into <body>, so no ancestor's overflow or stacking can clip it.
 * Escape and the backdrop close it — unless `dismissible` is false (e.g. while saving).
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  icon,
  size = 'md',
  dismissible = true,
  hideClose = false,
  className,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  size?: keyof typeof sizes;
  dismissible?: boolean;
  hideClose?: boolean;
  className?: string;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const hydrated = useHydrated();
  const onEscape = useEffectEvent(() => {
    if (dismissible) onClose();
  });

  useEffect(() => {
    if (!open || !hydrated) return undefined;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEscape();
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Focus the first field, or the panel itself.
    const t = setTimeout(() => {
      const target = panelRef.current?.querySelector<HTMLElement>('[autofocus], input, select, textarea') ?? panelRef.current;
      target?.focus();
    }, 30);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, hydrated]);

  if (!open || !hydrated) return null;

  return createPortal(
    <div className="fixed inset-0 z-200 flex items-end justify-center overflow-y-auto p-3 sm:items-center sm:p-6">
      <div className="fixed inset-0 animate-fade-in bg-ink-950/45 backdrop-blur-[3px]" onMouseDown={() => dismissible && onClose()} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn('relative my-auto w-full animate-pop rounded-3xl bg-white shadow-pop outline-none', sizes[size], className)}
      >
        {(title || !hideClose) && (
          <div className="flex items-start gap-3 px-6 pt-5 pb-1">
            {icon && <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600 [&_svg]:size-5">{icon}</span>}
            <div className="min-w-0 flex-1">
              {title && (
                <h2 id={titleId} className="text-[17px] font-bold text-ink-900">
                  {title}
                </h2>
              )}
              {description && <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{description}</p>}
            </div>
            {!hideClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={!dismissible}
                className="-mr-2 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
                aria-label="Close"
              >
                <X className="size-4.5" />
              </button>
            )}
          </div>
        )}
        <div className="px-6 pt-3 pb-6">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2.5 rounded-b-3xl border-t border-slate-100 bg-slate-50/60 px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

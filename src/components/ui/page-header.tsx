'use client';

import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useBack } from '@/components/layout/navigation-history';

/** The heading every page opens with: optional back, title, description and actions. */
export function PageHeader({
  title,
  description,
  eyebrow,
  back,
  onBack,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  /** Where Back goes when there is no in-app page to return to. */
  back?: string;
  /** A Back that steps within the page instead (it wins over `back`). */
  onBack?: () => void;
  actions?: ReactNode;
  className?: string;
}) {
  const goBack = useBack();
  return (
    <header className={cn('mb-5 flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {(back || onBack) && (
          <button
            type="button"
            onClick={() => (onBack ? onBack() : back && goBack(back))}
            className="group mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-card transition hover:border-brand-300 hover:text-brand-600"
            aria-label="Back"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          </button>
        )}
        <div className="min-w-0">
          {eyebrow && <p className="mb-0.5 text-[10.5px] font-bold tracking-[0.16em] text-gold-600 uppercase">{eyebrow}</p>}
          <h1 className="text-[20px] leading-tight font-extrabold tracking-tight text-ink-900 sm:text-[22px]">{title}</h1>
          {description && <p className="mt-0.5 max-w-2xl text-[13px] text-slate-500">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </header>
  );
}

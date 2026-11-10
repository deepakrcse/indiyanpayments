import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ServiceMark } from '@/components/brand/service-mark';

/**
 * Something you open — an admin tool, a report. One row: the service's mark (a real logo or a 3D
 * illustration), its name in the display face, one line of what it does, optional meta, and an
 * arrow. Used by Admin and Reports alike so both read and behave the same.
 *
 * Three states, kept visibly different so nobody mistakes "pointing at" for "chosen":
 *   rest      white, hairline border
 *   hover     lifts, border warms to navy, the mark pops, the arrow slides and fills
 *   selected  tinted, a navy bar on the left edge, the arrow filled navy
 */
export function ActionCard({
  title,
  description,
  mark,
  meta,
  href,
  onClick,
  selected = false,
  compact = false,
  className,
}: {
  title: string;
  description: string;
  mark: { src: string; logo?: boolean };
  meta?: ReactNode;
  href?: string;
  onClick?: () => void;
  selected?: boolean;
  /** Shorter row with a one-line description — for long lists that must fit one screen. */
  compact?: boolean;
  className?: string;
}) {
  const cls = cn(
    'group relative flex w-full items-center gap-3.5 overflow-hidden rounded-xl border px-3.5 text-left outline-none',
    compact ? 'min-h-12 py-1.5' : 'min-h-16 py-2.5',
    'transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out motion-reduce:transition-none',
    'focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
    selected
      ? 'border-brand-200 bg-gradient-to-r from-brand-50 to-white shadow-card'
      : 'border-slate-200/80 bg-white hover:-translate-y-px hover:border-brand-200 hover:shadow-[0_14px_28px_-18px_rgb(2_44_113/0.45)] motion-reduce:hover:translate-y-0',
    className,
  );
  const body = (
    <>
      {selected && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-brand-700" aria-hidden />}
      <ServiceMark
        src={mark.src}
        logo={mark.logo}
        size="sm"
        className={cn(
          'rounded-xl transition duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] motion-reduce:transition-none',
          compact ? 'h-9 w-14' : 'h-11 w-16',
          'group-hover:scale-105 group-hover:ring-brand-200 motion-reduce:group-hover:scale-100',
        )}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[14px] font-bold text-ink-900">{title}</span>
        <span className={cn('text-[12.5px] leading-snug text-slate-500', compact ? 'line-clamp-1' : 'line-clamp-2')}>{description}</span>
        {meta && <span className="mt-1 flex flex-wrap items-center gap-1.5">{meta}</span>}
      </span>
      <span
        className={cn(
          'grid size-8 shrink-0 place-items-center rounded-full transition duration-200',
          selected ? 'bg-brand-700 text-white' : 'bg-slate-50 text-slate-400 ring-1 ring-slate-200 group-hover:bg-brand-700 group-hover:text-white group-hover:ring-brand-700',
        )}
        aria-hidden
      >
        <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </span>
    </>
  );
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls} aria-pressed={selected}>
      {body}
    </button>
  );
}

'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ServiceMark, StatusPill, type ServiceStatus } from '@/components/brand/service-mark';

/**
 * A service on the dashboard. Its state follows from what it has: a link or an action makes it
 * live, `off` means a feature switch turned it off, and neither means no provider is connected yet
 * (it opens the "coming soon" note, as on TamilPay).
 */
export interface Tile {
  label: string;
  img: string;
  logo?: boolean;
  href?: string;
  onClick?: () => void;
  off?: boolean;
  /** TamilPay's "Instant" mark on Card Payments. */
  instant?: boolean;
}

export const statusOf = (t: Tile): ServiceStatus => (t.off ? 'off' : t.href || t.onClick ? 'live' : 'soon');

/**
 * Each group wears a shade of the logo's two colours — navy #022C71 and gold #B77F37 — set
 * corner to corner (navy · gold over bronze · royal) so neighbours never share a hue.
 */
export type Accent = 'navy' | 'gold' | 'bronze' | 'royal';

const ACCENTS: Record<Accent, { bar: string; chip: string; halo: string; tile: string; hover: string; wash: string; mark: string; label: string; arrow: string }> = {
  navy: {
    bar: 'from-brand-500 via-brand-700 to-brand-900',
    chip: 'from-brand-600 to-brand-900 shadow-[0_10px_20px_-10px_rgb(2_44_113/0.9)]',
    halo: 'bg-brand-200/50',
    tile: 'border-brand-100 from-brand-50 via-white to-brand-100/50',
    hover: 'hover:border-brand-300 hover:shadow-[0_22px_40px_-20px_rgb(2_44_113/0.65)]',
    wash: 'bg-brand-300/45',
    mark: 'ring-brand-100 group-hover:ring-brand-300 group-hover:shadow-[0_12px_24px_-10px_rgb(2_44_113/0.55)]',
    label: 'group-hover:text-brand-700',
    arrow: 'text-brand-700',
  },
  gold: {
    bar: 'from-gold-300 via-gold-500 to-gold-700',
    chip: 'from-gold-400 to-gold-600 shadow-[0_10px_20px_-10px_rgb(183_127_55/0.95)]',
    halo: 'bg-gold-200/60',
    tile: 'border-gold-100 from-gold-50 via-white to-gold-100/60',
    hover: 'hover:border-gold-300 hover:shadow-[0_22px_40px_-20px_rgb(183_127_55/0.7)]',
    wash: 'bg-gold-300/50',
    mark: 'ring-gold-100 group-hover:ring-gold-300 group-hover:shadow-[0_12px_24px_-10px_rgb(183_127_55/0.6)]',
    label: 'group-hover:text-gold-700',
    arrow: 'text-gold-600',
  },
  bronze: {
    bar: 'from-gold-400 via-gold-600 to-gold-800',
    chip: 'from-gold-500 to-gold-800 shadow-[0_10px_20px_-10px_rgb(119_81_31/0.95)]',
    halo: 'bg-gold-200/50',
    tile: 'border-gold-200/70 from-gold-50 via-white to-gold-200/40',
    hover: 'hover:border-gold-400 hover:shadow-[0_22px_40px_-20px_rgb(119_81_31/0.6)]',
    wash: 'bg-gold-400/35',
    mark: 'ring-gold-200 group-hover:ring-gold-400 group-hover:shadow-[0_12px_24px_-10px_rgb(119_81_31/0.55)]',
    label: 'group-hover:text-gold-800',
    arrow: 'text-gold-700',
  },
  royal: {
    bar: 'from-brand-300 via-brand-500 to-brand-700',
    chip: 'from-brand-400 to-brand-600 shadow-[0_10px_20px_-10px_rgb(47_91_191/0.95)]',
    halo: 'bg-brand-100/80',
    tile: 'border-brand-100 from-brand-50 via-white to-brand-100/40',
    hover: 'hover:border-brand-300 hover:shadow-[0_22px_40px_-20px_rgb(47_91_191/0.65)]',
    wash: 'bg-brand-200/60',
    mark: 'ring-brand-100 group-hover:ring-brand-300 group-hover:shadow-[0_12px_24px_-10px_rgb(47_91_191/0.55)]',
    label: 'group-hover:text-brand-600',
    arrow: 'text-brand-500',
  },
};

function ServiceTile({ tile, accent, onSoon }: { tile: Tile; accent: Accent; onSoon: (label: string) => void }) {
  const status = statusOf(tile);
  const a = ACCENTS[accent];
  const off = status === 'off';
  const cls = cn(
    'group relative isolate flex min-h-36 min-w-0 flex-col items-center justify-center gap-[clamp(0.5rem,1.4vh,0.9rem)] overflow-hidden rounded-2xl border bg-gradient-to-br px-3 py-4 text-center outline-none xl:min-h-0',
    'transition-[transform,box-shadow,border-color] duration-300 ease-out',
    'focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
    a.tile,
    off ? 'cursor-not-allowed opacity-60 saturate-50' : cn('hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]', a.hover),
    'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
  );
  const body = (
    <>
      {/* A colour wash that blooms from the corner on hover… */}
      <span
        className={cn(
          'pointer-events-none absolute -right-12 -bottom-12 -z-10 size-40 scale-50 rounded-full opacity-0 blur-2xl transition duration-500 ease-out group-hover:scale-125 group-hover:opacity-100 motion-reduce:transition-none',
          a.wash,
        )}
        aria-hidden
      />
      {/* …and a sheen that sweeps across it. */}
      <span
        className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-0 transition-[left,opacity] duration-700 ease-out group-hover:left-[130%] group-hover:opacity-100 motion-reduce:hidden"
        aria-hidden
      />

      <StatusPill status={status} className="absolute top-2.5 right-2.5" />
      {tile.instant && !off && (
        <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 px-1.5 py-0.5 text-[10px] leading-none font-bold tracking-wider text-white uppercase shadow-sm">
          <Zap className="size-2.5 fill-current group-hover:animate-pulse" /> Instant
        </span>
      )}

      <ServiceMark
        src={tile.img}
        logo={tile.logo}
        muted={off}
        className={cn(
          'transition duration-500 ease-[cubic-bezier(.34,1.56,.64,1)] motion-reduce:transition-none',
          !off && 'group-hover:-translate-y-0.5 group-hover:scale-110 group-hover:-rotate-3 motion-reduce:group-hover:transform-none',
          a.mark,
        )}
      />
      <span className={cn('text-[13.5px] leading-tight font-bold text-balance text-ink-900 transition-colors duration-300', !off && a.label)}>
        {tile.label}
        {status === 'live' && (
          <ArrowRight
            className={cn('ml-0 inline-block h-3.5 w-0 align-[-2px] opacity-0 transition-all duration-300 group-hover:ml-1 group-hover:w-3.5 group-hover:opacity-100', a.arrow)}
            aria-hidden
          />
        )}
      </span>
    </>
  );

  if (off) {
    return (
      <div className={cls} aria-disabled title={`${tile.label} — switched off`}>
        {body}
      </div>
    );
  }
  if (tile.href && status === 'live') {
    return (
      <Link href={tile.href} className={cls}>
        {body}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} onClick={status === 'live' ? tile.onClick : () => onSoon(tile.label)}>
      {body}
    </button>
  );
}

const COLS = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3' } as const;

/**
 * A dashboard group — Pay In, Pay Out, Verification, More: a coloured rule along the top, a
 * gradient icon chip, the title and TamilPay's caption, the group's state, then its tiles in one
 * row, one column per tile. Cards are sized in tile units on the page grid, so every tile on the
 * dashboard is the same width whichever card it sits in; a lone tile fills its row.
 */
export function HubCard({
  title,
  caption,
  icon: Icon,
  accent,
  tiles,
  disabled = false,
  onSoon,
  className,
}: {
  title: string;
  caption: string;
  icon: ComponentType<{ className?: string }>;
  accent: Accent;
  tiles: Tile[];
  disabled?: boolean;
  onSoon: (label: string) => void;
  className?: string;
}) {
  const a = ACCENTS[accent];
  const anyLive = tiles.some((t) => statusOf(t) === 'live');
  const n = Math.min(Math.max(tiles.length, 1), 3) as 1 | 2 | 3;
  return (
    <section className={cn('relative isolate flex min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-card transition-shadow duration-300 hover:shadow-lift', className)}>
      <span className={cn('h-1 shrink-0 bg-gradient-to-r', a.bar)} aria-hidden />
      <span className={cn('pointer-events-none absolute -top-20 -right-16 -z-10 size-56 rounded-full blur-3xl', a.halo)} aria-hidden />
      <header className="flex items-center gap-3 px-5 pt-3.5 pb-3">
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white', a.chip)}>
          <Icon className="size-4.5" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-[15px] leading-tight font-extrabold tracking-tight text-ink-900">{title}</h2>
          <p className="truncate text-[12px] text-slate-500">{caption}</p>
        </div>
        <span className="ml-auto shrink-0">{disabled ? <StatusPill status="off" /> : anyLive ? <StatusPill status="live" /> : <StatusPill status="soon" />}</span>
      </header>
      <div className={cn('grid min-h-0 flex-1 gap-3 px-3.5 pb-3.5 max-sm:grid-cols-2', COLS[n])}>
        {tiles.map((t, i) => (
          <div key={t.label} className={cn('flex min-h-0 [&>*]:flex-1', ((n === 3 && i === 2) || n === 1) && 'max-sm:col-span-2')}>
            <ServiceTile tile={t} accent={accent} onSoon={onSoon} />
          </div>
        ))}
      </div>
    </section>
  );
}

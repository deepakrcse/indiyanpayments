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
  /** One line on what the service does. */
  desc?: string;
  /** Two or three things you do there, shown as tags. */
  points?: string[];
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

const ACCENTS: Record<
  Accent,
  { bar: string; chip: string; halo: string; tile: string; hover: string; wash: string; mark: string; label: string; arrow: string; tag: string; cta: string; rings: string }
> = {
  navy: {
    tag: 'bg-brand-50 text-brand-700 ring-brand-100',
    cta: 'bg-brand-700 group-hover:bg-brand-800',
    rings: 'border-brand-200/70',
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
    tag: 'bg-gold-50 text-gold-700 ring-gold-200',
    cta: 'bg-gold-600 group-hover:bg-gold-700',
    rings: 'border-gold-200/80',
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
    tag: 'bg-gold-50 text-gold-800 ring-gold-200',
    cta: 'bg-gold-700 group-hover:bg-gold-800',
    rings: 'border-gold-300/60',
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
    tag: 'bg-brand-50 text-brand-600 ring-brand-100',
    cta: 'bg-brand-500 group-hover:bg-brand-600',
    rings: 'border-brand-200/70',
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
    'group relative isolate flex min-h-52 min-w-0 flex-col overflow-hidden rounded-2xl border bg-gradient-to-br p-[clamp(0.9rem,2.2vh,1.4rem)] text-left outline-none xl:min-h-0',
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

      {/* Quiet rings in the corner, so a tall tile never looks empty; they widen on hover. */}
      <span className="pointer-events-none absolute -right-[18%] -bottom-[18%] -z-10 size-[clamp(14rem,42vh,30rem)]" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn('absolute inset-0 rounded-full border transition-transform duration-700 ease-out group-hover:scale-110 motion-reduce:transition-none', a.rings)}
            style={{ transform: `scale(${1 - i * 0.24})` }}
          />
        ))}
      </span>

      {/* Corner badges: the state only when it isn't simply live (the group already says that). */}
      <span className="absolute top-[clamp(0.9rem,2.2vh,1.4rem)] right-[clamp(0.9rem,2.2vh,1.4rem)] flex flex-col items-end gap-1.5">
        {status !== 'live' && <StatusPill status={status} />}
        {tile.instant && !off && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 px-2 py-1 text-[10px] leading-none font-bold tracking-wider text-white uppercase shadow-sm">
            <Zap className="size-2.5 fill-current group-hover:animate-pulse" /> Instant
          </span>
        )}
      </span>

      {/* The mark, what it is and what you do there — centred in the space, larger on taller screens. */}
      <span className="flex min-w-0 flex-1 flex-col justify-center">
        <ServiceMark
          src={tile.img}
          logo={tile.logo}
          muted={off}
          className={cn(
            'h-[clamp(2.75rem,8.5vh,5.75rem)] origin-bottom-left transition duration-500 ease-[cubic-bezier(.34,1.56,.64,1)] motion-reduce:transition-none',
            tile.logo ? 'w-[clamp(5rem,15vh,10rem)]' : 'w-[clamp(2.75rem,8.5vh,5.75rem)]',
            !off && 'group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:-rotate-2 motion-reduce:group-hover:transform-none',
            a.mark,
          )}
        />
        <span
          className={cn(
            'mt-[clamp(0.75rem,2.6vh,1.75rem)] block text-[clamp(1rem,2.3vh,1.55rem)] leading-tight font-extrabold tracking-tight text-ink-900 transition-colors duration-300',
            !off && a.label,
          )}
        >
          {tile.label}
        </span>
        {/* Always two lines tall, so every tile's mark and title sit at the same height. */}
        {tile.desc && (
          <span className="mt-[clamp(0.25rem,0.8vh,0.5rem)] line-clamp-2 min-h-[2lh] text-[clamp(12.5px,1.4vh,14px)] leading-snug text-slate-500" title={tile.desc}>
            {tile.desc}
          </span>
        )}
      </span>

      {/* Bottom: what you do there, then the way in. */}
      {tile.points && tile.points.length > 0 && (
        <span className="mt-[clamp(0.75rem,2vh,1.25rem)] flex flex-wrap content-end gap-1.5 sm:min-h-[3.6rem]">
          {tile.points.map((p) => (
            <span key={p} className={cn('rounded-full bg-white/70 px-2.5 py-0.5 text-[clamp(11px,1.2vh,12.5px)] font-semibold ring-1 backdrop-blur-sm', a.tag)}>
              {p}
            </span>
          ))}
        </span>
      )}
      <span className="mt-[clamp(0.6rem,1.6vh,1rem)] flex items-center justify-between gap-2 border-t border-slate-900/6 pt-[clamp(0.6rem,1.6vh,1rem)]">
        <span className="text-[12px] font-semibold text-slate-400 transition-colors duration-300 group-hover:text-slate-600">
          {off ? 'Switched off' : status === 'live' ? `Open ${tile.label}` : 'Coming soon'}
        </span>
        {!off && (
          <span
            className={cn(
              'grid size-9 shrink-0 place-items-center rounded-full text-white shadow-md transition-all duration-300 group-hover:translate-x-0.5 group-hover:shadow-lg motion-reduce:transition-none',
              a.cta,
            )}
            aria-hidden
          >
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:-rotate-45" />
          </span>
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
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-[15px] leading-tight font-extrabold tracking-tight text-ink-900">{title}</h2>
            <span className="shrink-0">{disabled ? <StatusPill status="off" /> : anyLive ? <StatusPill status="live" /> : <StatusPill status="soon" />}</span>
          </div>
          <p className="truncate text-[12px] text-slate-500" title={caption}>
            {caption}
          </p>
        </div>
      </header>
      <div className={cn('grid min-h-0 flex-1 gap-3 px-3.5 pb-3.5 max-sm:grid-cols-1', COLS[n])}>
        {tiles.map((t) => (
          <div key={t.label} className="flex min-h-0 *:flex-1">
            <ServiceTile tile={t} accent={accent} onSoon={onSoon} />
          </div>
        ))}
      </div>
    </section>
  );
}

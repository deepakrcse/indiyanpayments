'use client';

import type { ComponentType, ReactNode } from 'react';
import Image from 'next/image';
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
  /** The feature card's button text, e.g. "Collect a payment". */
  cta?: string;
}

/** The group a service belongs to — Pay In, Pay Out, More — shown as the card's eyebrow. */
export interface Group {
  title: string;
  icon: ComponentType<{ className?: string }>;
  accent: Accent;
}

export const statusOf = (t: Tile): ServiceStatus => (t.off ? 'off' : t.href || t.onClick ? 'live' : 'soon');

/**
 * Each group wears a shade of the logo's two colours — navy #022C71 and gold #B77F37 — so
 * neighbouring cards never share a hue: Pay Out in bronze, More in royal blue.
 */
export type Accent = 'navy' | 'bronze' | 'royal';

const ACCENTS: Record<Accent, { eyebrow: string; chip: string; card: string; hover: string; wash: string; mark: string; label: string; tag: string; cta: string; rings: string }> = {
  navy: {
    eyebrow: 'text-brand-700',
    chip: 'from-brand-600 to-brand-900',
    card: 'border-brand-100 from-white via-white to-brand-50',
    hover: 'hover:border-brand-300 hover:shadow-[0_24px_44px_-22px_rgb(2_44_113/0.6)]',
    wash: 'bg-brand-300/40',
    mark: 'ring-brand-100 group-hover:ring-brand-300',
    label: 'group-hover:text-brand-700',
    tag: 'bg-brand-50 text-brand-700 ring-brand-100',
    cta: 'bg-brand-700 group-hover:bg-brand-800',
    rings: 'border-brand-200/70',
  },
  bronze: {
    eyebrow: 'text-gold-700',
    chip: 'from-gold-500 to-gold-800',
    card: 'border-gold-200/70 from-white via-gold-50/40 to-gold-100/70',
    hover: 'hover:border-gold-400 hover:shadow-[0_24px_44px_-22px_rgb(119_81_31/0.55)]',
    wash: 'bg-gold-300/45',
    mark: 'ring-gold-200 group-hover:ring-gold-400',
    label: 'group-hover:text-gold-800',
    tag: 'bg-white/80 text-gold-800 ring-gold-200',
    cta: 'bg-gold-700 group-hover:bg-gold-800',
    rings: 'border-gold-300/60',
  },
  royal: {
    eyebrow: 'text-brand-500',
    chip: 'from-brand-400 to-brand-600',
    card: 'border-brand-100 from-white via-brand-50/40 to-brand-100/60',
    hover: 'hover:border-brand-300 hover:shadow-[0_24px_44px_-22px_rgb(47_91_191/0.6)]',
    wash: 'bg-brand-200/60',
    mark: 'ring-brand-100 group-hover:ring-brand-300',
    label: 'group-hover:text-brand-600',
    tag: 'bg-white/80 text-brand-600 ring-brand-100',
    cta: 'bg-brand-500 group-hover:bg-brand-600',
    rings: 'border-brand-200/70',
  },
};

const focusRing = 'outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2';

/** The card itself: a link when live, a "coming soon" button when not connected, inert when off. */
function Shell({ tile, onSoon, className, children }: { tile: Tile; onSoon: (label: string) => void; className: string; children: ReactNode }) {
  const status = statusOf(tile);
  if (status === 'off') {
    return (
      <div className={className} aria-disabled title={`${tile.label} — switched off`}>
        {children}
      </div>
    );
  }
  if (tile.href && status === 'live') {
    return (
      <Link href={tile.href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={className} onClick={status === 'live' ? tile.onClick : () => onSoon(tile.label)}>
      {children}
    </button>
  );
}

/** Quiet concentric rings in a corner; they widen on hover. */
function Rings({ className, ring }: { className: string; ring: string }) {
  return (
    <span className={cn('pointer-events-none absolute -z-10', className)} aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn('absolute inset-0 rounded-full border transition-transform duration-700 ease-out group-hover:scale-110 motion-reduce:transition-none', ring)}
          style={{ transform: `scale(${1 - i * 0.24})` }}
        />
      ))}
    </span>
  );
}

function Eyebrow({ group, className }: { group: Group; className?: string }) {
  const Icon = group.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.14em] uppercase', className)}>
      <span className={cn('grid size-5 place-items-center rounded-md bg-gradient-to-br text-white', ACCENTS[group.accent].chip)}>
        <Icon className="size-3" />
      </span>
      {group.title}
    </span>
  );
}

function InstantBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 px-2 py-1 text-[10px] leading-none font-bold tracking-wider text-white uppercase shadow-sm">
      <Zap className="size-2.5 fill-current group-hover:animate-pulse" /> Instant
    </span>
  );
}

/**
 * The feature card — the main service, on navy, as tall as the grid beside it: what it is, what you
 * can do there and one clear button, with the service's picture floating in the corner.
 */
export function FeatureCard({ tile, group, onSoon, className }: { tile: Tile; group: Group; onSoon: (label: string) => void; className?: string }) {
  const status = statusOf(tile);
  const off = status === 'off';
  return (
    <Shell
      tile={tile}
      onSoon={onSoon}
      className={cn(
        'group bg-aurora relative isolate flex min-h-72 flex-col overflow-hidden rounded-3xl p-[clamp(1.25rem,3vh,2rem)] text-left text-white shadow-lift',
        'transition-[transform,box-shadow] duration-300 ease-out motion-reduce:transition-none',
        off ? 'cursor-not-allowed opacity-70 saturate-50' : 'hover:-translate-y-1 hover:shadow-[0_30px_60px_-24px_rgb(2_44_113/0.75)]',
        focusRing,
        className,
      )}
    >
      <span className="pointer-events-none absolute -top-24 -right-20 -z-10 size-72 animate-drift rounded-full bg-gold-500/25 blur-3xl" aria-hidden />
      <Rings className="-right-[30%] -bottom-[22%] size-[clamp(18rem,60vh,34rem)]" ring="border-white/10" />

      {/* The service's picture, large and tilted in the space above the text; it straightens on hover. */}
      <span
        className="pointer-events-none absolute top-[clamp(3.5rem,13vh,8.5rem)] right-[8%] -z-10 size-[clamp(7rem,25vh,15rem)] max-xl:top-[16%] max-xl:size-40 rotate-[-14deg] drop-shadow-[0_24px_30px_rgb(0_0_0/0.35)] transition duration-700 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:-translate-y-2 group-hover:rotate-[-4deg] motion-reduce:transition-none max-md:hidden"
        aria-hidden
      >
        <Image src={tile.img} alt="" fill sizes="12rem" className="object-contain" priority />
      </span>

      <span className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold tracking-[0.14em] uppercase ring-1 ring-white/15 backdrop-blur-sm">
          <group.icon className="size-3.5 text-gold-300" />
          {group.title}
        </span>
        <StatusPill status={status} />
      </span>

      <span className="mt-auto block max-w-[26rem] pt-[clamp(1rem,4vh,2.5rem)]">
        <span className="block text-[clamp(1.75rem,4.4vh,2.75rem)] leading-[1.05] font-extrabold tracking-tight">{tile.label}</span>
        {tile.desc && <span className="mt-[clamp(0.4rem,1.2vh,0.75rem)] block max-w-[20rem] text-[clamp(13px,1.6vh,15.5px)] leading-snug text-brand-100">{tile.desc}</span>}
        {tile.points && tile.points.length > 0 && (
          <span className="mt-[clamp(0.75rem,2vh,1.25rem)] flex flex-wrap gap-1.5">
            {tile.points.map((p) => (
              <span key={p} className="rounded-full bg-white/10 px-2.5 py-1 text-[clamp(11px,1.25vh,12.5px)] font-semibold text-white ring-1 ring-white/15 backdrop-blur-sm">
                {p}
              </span>
            ))}
          </span>
        )}
      </span>

      {!off && (
        <span className="mt-[clamp(1rem,3vh,1.75rem)] inline-flex items-center gap-2 self-start rounded-full bg-white py-2 pr-2 pl-5 text-[14px] font-bold text-brand-800 shadow-[0_12px_24px_-12px_rgb(0_0_0/0.5)] transition-[padding] duration-300 group-hover:pr-2.5">
          {tile.cta ?? `Open ${tile.label}`}
          <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-white transition-transform duration-300 group-hover:translate-x-0.5">
            <ArrowRight className="size-4" />
          </span>
        </span>
      )}
    </Shell>
  );
}

/**
 * A wide service card: the group as an eyebrow, the service's mark beside its name and line, then
 * what you do there and the way in.
 */
export function ServiceCard({ tile, group, onSoon, className }: { tile: Tile; group: Group; onSoon: (label: string) => void; className?: string }) {
  const status = statusOf(tile);
  const a = ACCENTS[group.accent];
  const off = status === 'off';
  return (
    <Shell
      tile={tile}
      onSoon={onSoon}
      className={cn(
        'group relative isolate flex min-h-48 min-w-0 flex-col overflow-hidden rounded-3xl border bg-gradient-to-br p-[clamp(1rem,2.6vh,1.6rem)] text-left shadow-card',
        'transition-[transform,box-shadow,border-color] duration-300 ease-out motion-reduce:transition-none',
        a.card,
        off ? 'cursor-not-allowed opacity-60 saturate-50' : cn('hover:-translate-y-1 active:translate-y-0 active:scale-[0.99]', a.hover),
        focusRing,
        className,
      )}
    >
      {/* A colour wash that blooms from the corner, and a sheen that sweeps across, on hover. */}
      <span
        className={cn(
          'pointer-events-none absolute -right-16 -bottom-16 -z-10 size-56 scale-50 rounded-full opacity-0 blur-2xl transition duration-500 ease-out group-hover:scale-125 group-hover:opacity-100 motion-reduce:transition-none',
          a.wash,
        )}
        aria-hidden
      />
      <span
        className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-0 transition-[left,opacity] duration-700 ease-out group-hover:left-[130%] group-hover:opacity-100 motion-reduce:hidden"
        aria-hidden
      />
      <Rings className="-right-20 -bottom-24 size-[clamp(13rem,34vh,20rem)]" ring={a.rings} />

      <span className="flex items-center justify-between gap-2">
        <Eyebrow group={group} className={a.eyebrow} />
        <span className="flex items-center gap-1.5">
          {tile.instant && !off && <InstantBadge />}
          {status !== 'live' && <StatusPill status={status} />}
        </span>
      </span>

      <span className="my-auto flex items-center gap-[clamp(0.75rem,2vh,1.25rem)] py-[clamp(0.75rem,2.2vh,1.5rem)]">
        <ServiceMark
          src={tile.img}
          logo={tile.logo}
          muted={off}
          className={cn(
            'h-[clamp(3rem,8vh,4.75rem)] transition duration-500 ease-[cubic-bezier(.34,1.56,.64,1)] motion-reduce:transition-none',
            tile.logo ? 'w-[clamp(5.5rem,14vh,8.5rem)]' : 'w-[clamp(3rem,8vh,4.75rem)]',
            !off && 'group-hover:-translate-y-0.5 group-hover:scale-105 group-hover:-rotate-3 motion-reduce:group-hover:transform-none',
            a.mark,
          )}
        />
        <span className="min-w-0">
          <span className={cn('block text-[clamp(1.05rem,2.5vh,1.4rem)] leading-tight font-extrabold tracking-tight text-ink-900 transition-colors duration-300', !off && a.label)}>
            {tile.label}
          </span>
          {tile.desc && <span className="mt-0.5 line-clamp-2 block text-[clamp(12.5px,1.45vh,14px)] leading-snug text-slate-500">{tile.desc}</span>}
        </span>
      </span>

      <span className="flex items-end justify-between gap-3">
        <span className="flex min-w-0 flex-wrap gap-1.5">
          {tile.points?.map((p) => (
            <span key={p} className={cn('rounded-full px-2.5 py-0.5 text-[clamp(11px,1.2vh,12.5px)] font-semibold ring-1 backdrop-blur-sm', a.tag)}>
              {p}
            </span>
          ))}
        </span>
        {!off && (
          <span
            className={cn('grid size-10 shrink-0 place-items-center rounded-full text-white shadow-md transition-all duration-300 group-hover:shadow-lg motion-reduce:transition-none', a.cta)}
            aria-hidden
          >
            <ArrowRight className="size-4.5 transition-transform duration-300 group-hover:-rotate-45" />
          </span>
        )}
      </span>
    </Shell>
  );
}

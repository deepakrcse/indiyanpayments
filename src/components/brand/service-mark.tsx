import Image from 'next/image';
import { cn } from '@/lib/cn';

export type ServiceStatus = 'live' | 'soon' | 'off';

/**
 * A service's picture in a white rounded box: a brand wordmark (`logo`, from /public/logos) or a
 * 3D illustration (from /public/services). The box grows with the screen's height, so tiles look
 * balanced from a 720px laptop to a 1080p monitor without breakpoints.
 */
export function ServiceMark({ src, logo = false, muted = false, size = 'md', className }: { src: string; logo?: boolean; muted?: boolean; size?: 'md' | 'sm'; className?: string }) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-2xl bg-white shadow-[0_6px_16px_-8px_rgb(15_23_42/0.28)] ring-1 ring-slate-200/70',
        size === 'md' ? 'h-[clamp(2.75rem,7.5vh,4.5rem)]' : 'h-12',
        size === 'md' ? (logo ? 'w-[clamp(5rem,13vh,7.75rem)]' : 'w-[clamp(2.75rem,7.5vh,4.5rem)]') : logo ? 'w-20' : 'w-12',
        muted && 'opacity-60 grayscale',
        className,
      )}
    >
      <Image
        src={src}
        alt=""
        width={logo ? 200 : 96}
        height={logo ? 80 : 96}
        unoptimized={src.endsWith('.svg')}
        className={cn('object-contain', logo ? 'h-[52%] w-[82%]' : 'h-[64%] w-[64%]')}
      />
    </span>
  );
}

const PILL: Record<ServiceStatus, { text: string; title: string; cls: string; dot: string }> = {
  live: { text: 'Live', title: 'Live — ready to use', cls: 'bg-jade-50 text-jade-700 ring-jade-100', dot: 'bg-jade-500' },
  soon: { text: 'Soon', title: 'Coming soon — no provider connected yet', cls: 'bg-gold-50 text-gold-700 ring-gold-200', dot: 'bg-gold-500' },
  off: { text: 'Off', title: 'Switched off for now', cls: 'bg-rose-50 text-rose-600 ring-rose-100', dot: 'bg-rose-500' },
};

/** Live / Soon / Off — always a word and a dot, never colour alone. */
export function StatusPill({ status, className }: { status: ServiceStatus; className?: string }) {
  const p = PILL[status];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] leading-none font-bold tracking-wider uppercase ring-1', p.cls, className)} title={p.title}>
      <i className={cn('size-1.5 rounded-full', p.dot, status === 'live' && 'animate-pulse')} aria-hidden />
      {p.text}
    </span>
  );
}

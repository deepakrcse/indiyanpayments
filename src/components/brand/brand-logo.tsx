import type { CSSProperties } from 'react';
import Image, { type StaticImageData } from 'next/image';
import { cn } from '@/lib/cn';
import logoArt from '@/assets/brand/indiyana-logo.png';
import markArt from '@/assets/brand/indiyana-mark.png';

const NAME = 'Indiyana Payments';

/**
 * A soft light that sweeps across the artwork every few seconds — masked to the artwork itself,
 * so it only ever touches the logo, never the background around it. Off for reduced motion.
 */
function Sheen({ art }: { art: StaticImageData }) {
  const mask = `url(${art.src})`;
  const style: CSSProperties = { maskImage: mask, WebkitMaskImage: mask, maskSize: '100% 100%', WebkitMaskSize: '100% 100%' };
  return <span aria-hidden className="logo-sheen pointer-events-none absolute inset-0" style={style} />;
}

/**
 * The artwork, imported rather than referenced by URL: its size comes from the file, and its URL
 * carries a content hash, so a new logo is never hidden behind a cached copy of the old one.
 */
function Art({ art, width, height, priority, className }: { art: StaticImageData; width: number; height: number; priority: boolean; className?: string }) {
  return (
    <span
      className={cn('group/logo relative inline-block shrink-0 transition-transform duration-300 ease-out hover:-translate-y-px hover:scale-[1.03] motion-reduce:transition-none motion-reduce:hover:transform-none', className)}
      style={{ width, height }}
    >
      <Image src={art} alt={NAME} width={width} height={height} priority={priority} className="size-full select-none" draggable={false} />
      <Sheen art={art} />
    </span>
  );
}

/** The Indiyana Payments mark on its own — the navy flame with the gold arrow. */
export function BrandMark({ size = 36, className, priority = false }: { size?: number; className?: string; priority?: boolean }) {
  return <Art art={markArt} width={size} height={size} priority={priority} className={className} />;
}

/** The full logo, mark and wordmark, sized by its height (the width follows the artwork). */
export function BrandLogo({ height = 44, className, priority = false }: { height?: number; className?: string; priority?: boolean }) {
  return <Art art={logoArt} width={Math.round((height * logoArt.width) / logoArt.height)} height={height} priority={priority} className={className} />;
}

import Image from 'next/image';
import { cn } from '@/lib/cn';

/** Artwork: public/brand/indiyan-logo.png (mark + wordmark) and indiyan-mark.png (mark only). */
const LOGO_RATIO = 1352 / 752;

/** The Indiyan Payments mark on its own — the navy flame with the gold arrow. */
export function BrandMark({ size = 36, className, priority = false }: { size?: number; className?: string; priority?: boolean }) {
  return <Image src="/brand/indiyan-mark.png" alt="Indiyan Payments" width={size} height={size} priority={priority} className={cn('shrink-0 select-none', className)} draggable={false} />;
}

/** The full logo, mark and wordmark, sized by its height. */
export function BrandLogo({ height = 44, className, priority = false }: { height?: number; className?: string; priority?: boolean }) {
  return (
    <Image
      src="/brand/indiyan-logo.png"
      alt="Indiyan Payments"
      width={Math.round(height * LOGO_RATIO)}
      height={height}
      priority={priority}
      className={cn('shrink-0 select-none', className)}
      draggable={false}
    />
  );
}

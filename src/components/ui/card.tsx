import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Every surface: white, a hairline border, a soft shadow, the same radius everywhere. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl border border-slate-200/70 bg-white shadow-card', className)} {...props} />;
}

export type HeadingTone = 'navy' | 'gold';

const CHIP: Record<HeadingTone, string> = {
  navy: 'from-brand-600 to-brand-900 shadow-[0_8px_16px_-10px_rgb(2_44_113/0.9)]',
  gold: 'from-gold-400 to-gold-600 shadow-[0_8px_16px_-10px_rgb(183_127_55/0.95)]',
};

/**
 * The one section heading used across the portal — Home's groups, Admin's groups, Reports, and
 * every card on every page: a gradient chip in the logo's navy (or gold), the title in the display
 * face, one line of caption, and actions on the right. Same anatomy everywhere, so people learn
 * it once.
 */
export function SectionHeading({
  title,
  description,
  icon,
  actions,
  tone = 'navy',
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  tone?: HeadingTone;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <div className="flex min-w-0 items-center gap-3">
        {icon && <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white [&_svg]:size-4', CHIP[tone])}>{icon}</span>}
        <div className="min-w-0">
          <h2 className="truncate text-[15px] leading-tight font-bold text-ink-900">{title}</h2>
          {description && <p className="line-clamp-2 text-[12px] leading-snug text-slate-500">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** A card's heading row: the section heading with a hairline under it. */
export function CardHeader({
  title,
  description,
  icon,
  actions,
  tone,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  tone?: HeadingTone;
  className?: string;
}) {
  return <SectionHeading title={title} description={description} icon={icon} actions={actions} tone={tone} className={cn('border-b border-slate-100 px-4 py-3', className)} />;
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props} />;
}

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'dark';
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white shadow-[0_6px_18px_-6px_rgb(2_44_113/0.55)] hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-300 disabled:shadow-none',
  secondary: 'bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200 disabled:text-brand-300',
  outline: 'border border-slate-200 bg-white text-ink-800 hover:border-brand-300 hover:bg-brand-50/50 disabled:text-slate-400',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-ink-900 disabled:text-slate-300',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 disabled:bg-rose-300',
  success: 'bg-jade-600 text-white hover:bg-jade-700 disabled:bg-jade-500/50',
  dark: 'bg-ink-900 text-white hover:bg-ink-800 disabled:bg-ink-600',
};

const sizes: Record<Size, string> = {
  xs: 'h-7 gap-1 rounded-lg px-2.5 text-xs',
  sm: 'h-9 gap-1.5 rounded-xl px-3.5 text-[13px]',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-12 gap-2 rounded-2xl px-6 text-[15px]',
  icon: 'size-10 rounded-xl',
  'icon-sm': 'size-8 rounded-lg',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, block = false, className, children, disabled, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap transition-all duration-150 select-none',
        'disabled:cursor-not-allowed [&_svg]:shrink-0',
        variants[variant],
        sizes[size],
        // Full width, but free to share a row: two block buttons side by side split it instead of overflowing.
        block && 'w-full min-w-0 shrink',
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

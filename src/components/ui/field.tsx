'use client';

import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/cn';

export const controlClass = cn(
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-ink-900 shadow-[inset_0_1px_1px_rgb(10_20_48/0.03)]',
  'placeholder:text-slate-400 transition-colors outline-none',
  'hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12',
  'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
  'aria-invalid:border-rose-400 aria-invalid:focus:ring-rose-500/12',
);

export function Label({ children, htmlFor, className }: { children: ReactNode; htmlFor?: string; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn('mb-1.5 block text-[12.5px] font-semibold text-slate-600', className)}>
      {children}
    </label>
  );
}

export function FieldError({ children, id }: { children?: ReactNode; id?: string }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-[12.5px] font-medium text-rose-600">
      {children}
    </p>
  );
}

export function FieldHint({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p className="mt-1.5 text-[12px] text-slate-500">{children}</p>;
}

/** Label + control + hint/error, wired up for accessibility. Pass a render function to get the id. */
export function Field({
  label,
  error,
  hint,
  className,
  children,
}: {
  label: ReactNode;
  error?: string | null;
  hint?: ReactNode;
  className?: string;
  children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ReactNode;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': error ? errorId : undefined })}
      {error ? <FieldError id={errorId}>{error}</FieldError> : <FieldHint>{hint}</FieldHint>}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { leading?: ReactNode; trailing?: ReactNode }>(
  function Input({ className, leading, trailing, ...props }, ref) {
    if (!leading && !trailing) return <input ref={ref} className={cn(controlClass, 'h-11', className)} {...props} />;
    return (
      <div className="relative">
        {leading && <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">{leading}</span>}
        <input ref={ref} className={cn(controlClass, 'h-11', leading && 'pl-10', trailing && 'pr-11', className)} {...props} />
        {trailing && <span className="absolute inset-y-0 right-2 flex items-center">{trailing}</span>}
      </div>
    );
  },
);

/** An input with a fixed prefix box, e.g. "+91". */
export const PrefixInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { prefix: ReactNode }>(
  function PrefixInput({ prefix, className, ...props }, ref) {
    return (
      <div className="flex">
        <span className="inline-flex h-11 items-center gap-1.5 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-500">
          {prefix}
        </span>
        <input ref={ref} className={cn(controlClass, 'h-11 rounded-l-none', className)} {...props} />
      </div>
    );
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(controlClass, 'min-h-24 py-3 leading-relaxed', className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        controlClass,
        'h-11 cursor-pointer appearance-none select-chevron pr-10',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});

/** A password/PIN box with a show-hide toggle. */
export const SecretInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function SecretInput(props, ref) {
  const [shown, setShown] = useState(false);
  return (
    <Input
      ref={ref}
      {...props}
      type={shown ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label={shown ? 'Hide' : 'Show'}
        >
          {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      }
    />
  );
});

export function Checkbox({ label, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2.5 text-sm font-medium text-ink-800', className)}>
      <input type="checkbox" className="size-4 cursor-pointer rounded border-slate-300 accent-brand-600" {...props} />
      {label}
    </label>
  );
}

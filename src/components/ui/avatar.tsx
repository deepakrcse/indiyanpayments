import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';

const TONES = [
  'from-brand-500 to-brand-700',
  'from-jade-500 to-jade-700',
  'from-gold-400 to-gold-600',
  'from-sky-500 to-indigo-600',
  'from-fuchsia-500 to-brand-600',
];

function toneFor(text: string) {
  let hash = 0;
  for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[hash % TONES.length];
}

/** A gradient circle with someone's initials; the colour is stable per name. */
export function Avatar({ name, size = 40, className }: { name: string | null | undefined; size?: number; className?: string }) {
  const label = name ?? '';
  return (
    <span
      className={cn('grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-bold text-white', toneFor(label), className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      aria-hidden
    >
      {initials(label)}
    </span>
  );
}

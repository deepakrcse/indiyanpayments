'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { billerInitials, billerLogo } from './billers';

const TONES = ['bg-brand-50 text-brand-700', 'bg-gold-50 text-gold-600', 'bg-jade-50 text-jade-700', 'bg-sky-50 text-sky-700'];

function toneFor(text: string) {
  let hash = 0;
  for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[hash % TONES.length];
}

/** A bank's symbol in a circle, or its initials when there is no public logo (or it fails to load). */
export function BillerAvatar({ billerId, name, size = 44 }: { billerId: string; name: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const logo = billerLogo(billerId);
  return (
    <span className={cn('grid shrink-0 place-items-center overflow-hidden rounded-full border border-slate-100 bg-white font-extrabold', (!logo || failed) && toneFor(name))} style={{ width: size, height: size, fontSize: size * 0.32 }}>
      {logo && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote SVG bank symbols
        <img src={logo} alt="" loading="lazy" className="size-[62%] object-contain" onError={() => setFailed(true)} />
      ) : (
        billerInitials(name)
      )}
    </span>
  );
}

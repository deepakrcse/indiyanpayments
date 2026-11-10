'use client';

import { useEffect } from 'react';
import { RotateCcw, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** A rendering error anywhere below the root: say so plainly and offer a retry. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-rose-50 text-rose-600">
        <TriangleAlert className="size-8" />
      </span>
      <h1 className="mt-5 text-xl font-extrabold text-ink-900">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-[14px] text-slate-500">This screen hit an unexpected error. Nothing was sent twice — try again.</p>
      {error.digest && <p className="mt-2 font-mono text-[11px] text-slate-400">Ref {error.digest}</p>}
      <Button className="mt-6" onClick={reset}>
        <RotateCcw className="size-4" /> Try again
      </Button>
    </div>
  );
}

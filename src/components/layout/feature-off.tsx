import Link from 'next/link';
import { Ban } from 'lucide-react';
import { routes } from '@/config/routes';

/** Shown in place of a page whose feature is switched off (see config/features.ts). */
export function FeatureOff({ name }: { name: string }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        <Ban className="size-7" />
      </span>
      <h1 className="mt-5 text-xl font-extrabold text-ink-900">{name} is temporarily unavailable</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-slate-500">This service is switched off right now. Your earlier payments are still in Reports.</p>
      <div className="mt-6 flex gap-2.5">
        <Link href={routes.home} className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          Back to dashboard
        </Link>
        <Link href={routes.reports} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-800 hover:border-brand-300">
          Open reports
        </Link>
      </div>
    </div>
  );
}

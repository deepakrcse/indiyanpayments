import Link from 'next/link';
import { Compass } from 'lucide-react';
import { BrandMark } from '@/components/brand/brand-logo';
import { routes } from '@/config/routes';

export default function NotFound() {
  return (
    <div className="canvas-grid flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <BrandMark size={72} priority />
      <span className="mt-8 grid size-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        <Compass className="size-8" />
      </span>
      <h1 className="mt-5 text-2xl font-extrabold text-ink-900">This page doesn&apos;t exist</h1>
      <p className="mt-2 max-w-sm text-[14px] text-slate-500">The address may be mistyped, or the page has moved.</p>
      <Link href={routes.home} className="mt-6 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
        Back to dashboard
      </Link>
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { BrandLogo } from '@/components/brand/brand-logo';
import { PaymentStatusCard } from '@/features/payment-gateway/payment-status-card';
import { routes } from '@/config/routes';

export const metadata: Metadata = { title: 'Payment status' };

/** Public: the payer's own result after the gateway. No sign-in needed. */
export default async function PaymentStatusPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const params = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  return (
    <div className="canvas-grid flex min-h-dvh flex-col">
      <header className="flex h-18 items-center border-b border-slate-200/70 bg-white/80 px-6 backdrop-blur">
        <Link href={routes.home} aria-label="Indiyana Payments">
          <BrandLogo height={46} priority />
        </Link>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-10">
        <PaymentStatusCard key={JSON.stringify(params)} params={params} />
        <p className="flex items-center gap-1.5 text-[12.5px] text-slate-500">
          <ShieldCheck className="size-4 text-jade-600" /> Secured by Indiyana Payments ·{' '}
          <Link href={routes.wallet} className="font-semibold text-brand-600 hover:text-brand-800">
            Go to wallet ledger
          </Link>
        </p>
      </main>
    </div>
  );
}

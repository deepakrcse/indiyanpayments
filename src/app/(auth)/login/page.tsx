import type { Metadata } from 'next';
import { Lock } from 'lucide-react';
import { BrandLogo } from '@/components/brand/brand-logo';
import { LoginForm } from '@/features/auth/login-form';
import { site } from '@/config/site';

export const metadata: Metadata = { title: 'Sign in' };

/** One card in the middle of the screen: the logo, the form, and nothing else to read. */
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="canvas-grid relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10">
      {/* The logo's two colours, softly, behind the card. */}
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-brand-200/40 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-24 -bottom-32 size-80 rounded-full bg-gold-100/70 blur-3xl" aria-hidden />

      <main className="relative w-full max-w-[420px]">
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-lift">
          <div className="h-1 bg-gradient-to-r from-brand-700 via-brand-600 to-gold-500" aria-hidden />
          <div className="px-7 pt-8 pb-7 sm:px-9">
            <div className="flex justify-center">
              <BrandLogo height={64} priority />
            </div>
            <h1 className="mt-6 text-center text-[22px] font-extrabold tracking-tight text-ink-900">Sign in to your counter</h1>
            <p className="mt-1.5 text-center text-[13.5px] text-slate-500">Use the login ID and password issued to your store.</p>
            <div className="mt-7">
              <LoginForm next={next ?? null} />
            </div>
          </div>
        </div>
        <p className="mt-5 flex items-center justify-center gap-1.5 text-[12px] text-slate-500">
          <Lock className="size-3.5 text-jade-600" /> Secure session · signs out automatically at midnight
        </p>
        <p className="mt-1 text-center text-[11.5px] text-slate-400">
          © {new Date().getFullYear()} {site.name}
        </p>
      </main>
    </div>
  );
}

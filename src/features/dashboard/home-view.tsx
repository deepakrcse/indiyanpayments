'use client';

import { useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, CalendarDays, History, LayoutGrid, ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { count, rupees, rupeesCompact } from '@/lib/format';
import { features } from '@/config/features';
import { routes } from '@/config/routes';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { useSession } from '@/features/auth/session-context';
import { useDashboardSummary } from './admin-kpis';
import { DifferenceHistoryDialog } from './difference-history-dialog';
import { HubCard, type Tile } from './service-hub';
import { StaticQrDialog } from './static-qr-dialog';

const icon = (name: string) => `/services/${name}.png`;
const logo = (file: string) => `/logos/${file}`;

function greeting(date = new Date()) {
  const h = date.getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

/** Admin only: the four numbers TamilPay showed at the top of Home, refreshed every 30 seconds. */
function AdminNumbers() {
  const { data, isPending } = useDashboardSummary();
  const [history, setHistory] = useState(false);
  const diff = data?.difference ?? 0;
  const items = [
    { label: 'Pipe balance', full: rupees(data?.totalPipeBalance), short: rupeesCompact(data?.totalPipeBalance) },
    { label: 'Wallet balance', full: rupees(data?.totalWalletBalance), short: rupeesCompact(data?.totalWalletBalance) },
    { label: 'Wallets', full: count(data?.walletCount ?? 0), short: count(data?.walletCount ?? 0) },
    { label: 'Difference', full: rupees(diff), short: rupeesCompact(diff), tone: diff >= 0 ? 'text-jade-500' : 'text-rose-300', history: true },
  ];
  return (
    <dl className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      {items.map((it) => (
        <div key={it.label} className="flex min-w-0 items-center gap-2 rounded-2xl bg-white/[0.08] px-3.5 py-2 ring-1 ring-white/10">
          <span className="min-w-0">
            <dt className="text-[10px] font-bold tracking-wider whitespace-nowrap text-brand-200 uppercase">{it.label}</dt>
            <dd className={cn('text-[15px] font-extrabold whitespace-nowrap tabular', it.tone)} title={it.full}>
              {isPending ? (
                <span className="skeleton inline-block h-4 w-16 rounded opacity-30" />
              ) : (
                <>
                  <span className="2xl:hidden">{it.short}</span>
                  <span className="max-2xl:hidden">{it.full}</span>
                </>
              )}
            </dd>
          </span>
          {it.history && (
            <button type="button" onClick={() => setHistory(true)} className="grid size-7 shrink-0 place-items-center rounded-lg bg-white/10 transition hover:bg-white/20" aria-label="Difference history" title="Difference history">
              <History className="size-3.5" />
            </button>
          )}
        </div>
      ))}
      <DifferenceHistoryDialog open={history} onClose={() => setHistory(false)} />
    </dl>
  );
}

/**
 * The dashboard — TamilPay's four groups and nothing more:
 *   Pay In        Card PG · Dynamic QR (soon) · Static QR
 *   Pay Out       IMPS · Self Settlement (soon) · Card Payments   (all off when pay-out is switched off)
 *   Verification  Aadhaar · PAN (both soon)
 *   More          Reports · Retailers (distributors) · Admin (admins)
 * Laid out on a five-column grid in tile units: the three-tile groups take three columns on the
 * left, the two-tile groups two on the right, so every tile is the same size and they line up in
 * columns across both rows. Money in and out read down the left; tools down the right.
 * On a desktop it is exactly one screen tall; on small screens the groups stack.
 */
export function HomeView() {
  const { user, isAdmin, isDistributor } = useSession();
  const [qrOpen, setQrOpen] = useState(false);
  const [soon, setSoon] = useState<string | null>(null);

  const name = (user.fullName || user.username).trim().split(/\s+/)[0];
  const payOutOff = features.payOutDisabled;

  const payIn: Tile[] = [
    { label: 'Card PG', img: icon('card'), href: routes.gateway },
    { label: 'Dynamic QR', img: icon('phone-arrow') },
    { label: 'Static QR', img: logo('upi.svg'), logo: true, onClick: () => setQrOpen(true), off: features.staticQrDisabled },
  ];
  const payOut: Tile[] = [
    { label: 'IMPS', img: logo('imps.svg'), logo: true, href: routes.imps, off: payOutOff },
    { label: 'Self Settlement', img: icon('coin'), off: payOutOff },
    { label: 'Card Payments', img: logo('bharat-billpay.svg'), logo: true, href: routes.cardBills, off: payOutOff, instant: true },
  ];
  const verification: Tile[] = [
    { label: 'Aadhaar Verification', img: icon('bust') },
    { label: 'PAN Verification', img: icon('id-card') },
  ];
  const more: Tile[] = [
    { label: 'Reports', img: icon('bar-chart'), href: routes.reports },
    ...(isDistributor ? [{ label: 'Retailers', img: icon('store'), href: routes.myRetailers }] : []),
    ...(isAdmin ? [{ label: 'Admin', img: icon('gear'), href: routes.admin }] : []),
  ];

  return (
    <div className="grid gap-4 md:grid-cols-5 xl:h-[calc(100dvh-var(--chrome-h))] xl:grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)]">
      {/* ── Greeting: name, store and today's date; for admins, the business numbers ── */}
      <section className="bg-aurora relative flex flex-wrap items-center gap-x-6 gap-y-3 overflow-hidden rounded-3xl px-6 py-4 text-white shadow-lift md:col-span-5">
        <div className="pointer-events-none absolute -top-20 right-1/3 size-56 animate-drift rounded-full bg-gold-500/20 blur-3xl" aria-hidden />
        <div className="relative min-w-0">
          <h1 className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <span className="text-[21px] leading-tight font-extrabold tracking-tight" suppressHydrationWarning>
              {greeting()}, {name}
            </span>
            {user.storeName && <span className="text-[15px] font-medium text-brand-100">{user.storeName}</span>}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-brand-200" suppressHydrationWarning>
            <CalendarDays className="size-3.5 text-gold-400" />
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {isAdmin && (
          <div className="relative w-full lg:ml-auto lg:w-auto">
            <AdminNumbers />
          </div>
        )}
      </section>

      <HubCard title="Pay In" caption="Accept payments from your customers" icon={ArrowDownToLine} accent="navy" tiles={payIn} onSoon={setSoon} className="md:col-span-3" />
      <HubCard title="Verification" caption="Verify customer identity" icon={ShieldCheck} accent="gold" tiles={verification} onSoon={setSoon} className="md:col-span-2" />
      <HubCard title="Pay Out" caption="Send money and settle balances" icon={ArrowUpFromLine} accent="bronze" tiles={payOut} disabled={payOutOff} onSoon={setSoon} className="md:col-span-3" />
      <HubCard title="More" caption="Manage and monitor" icon={LayoutGrid} accent="royal" tiles={more} onSoon={setSoon} className="md:col-span-2" />

      <StaticQrDialog open={qrOpen} onClose={() => setQrOpen(false)} />
      <Dialog open={Boolean(soon)} onClose={() => setSoon(null)} title={soon ?? ''} size="sm" icon={<Sparkles />}>
        <p className="text-[13.5px] leading-relaxed text-slate-600">This service isn&apos;t live yet — there&apos;s no provider connected for it. It&apos;s listed so the full catalogue is visible.</p>
        <Button block className="mt-5" onClick={() => setSoon(null)}>
          Got it
        </Button>
      </Dialog>
    </div>
  );
}

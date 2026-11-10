'use client';

import { useRef, useState, type ComponentType } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, QrCode, Settings, X } from 'lucide-react';
import { api } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { cn } from '@/lib/cn';
import { count, rupees } from '@/lib/format';
import { routes } from '@/config/routes';
import { ActionCard } from '@/components/ui/action-card';
import { StatusBadge } from '@/components/ui/badge';
import { Card, CardHeader, SectionHeading } from '@/components/ui/card';
import { Alert, Skeleton } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/page-header';
import { useDashboardSummary } from '@/features/dashboard/admin-kpis';
import { DistributorsDialog } from '@/features/customers/distributors-dialog';
import type { DashboardExplain } from '@/types/admin';

interface Tool {
  label: string;
  description: string;
  /** A real logo (`logo`) or a 3D illustration — the same marks as Home and Reports. */
  mark: { src: string; logo?: boolean };
  href?: string;
  onClick?: () => void;
  active?: boolean;
}

interface Group {
  key: string;
  title: string;
  caption: string;
  icon: ComponentType<{ className?: string }>;
  tools: Tool[];
}

const icon3d = (name: string) => ({ src: `/services/${name}.png` });
const brand = (file: string) => ({ src: `/logos/${file}`, logo: true });

/** A group of tools: the shared section heading, then its tools as rows that share the card's height. */
function GroupCard({ group, className }: { group: Group; className?: string }) {
  const Icon = group.icon;
  return (
    <Card className={cn('flex min-h-0 flex-col p-3', className)}>
      <SectionHeading title={group.title} description={group.caption} icon={<Icon />} className="mb-3 px-1 [&_p]:line-clamp-1" />
      <div className="scrollbar-thin -m-1 grid min-h-0 flex-1 auto-rows-fr grid-cols-1 gap-2 overflow-y-auto p-1">
        {group.tools.map((t) => (
          <ActionCard key={t.label} title={t.label} description={t.description} mark={t.mark} href={t.href} onClick={t.onClick} selected={t.active} compact className="h-full" />
        ))}
      </div>
    </Card>
  );
}

const money = (n: number | null | undefined) => rupees(n);

/**
 * The Dashboard panel — what TamilPay's Dashboard tile opens beside the tools: the four numbers,
 * the difference explained with today's movements, and every payment pipe's live balance.
 */
function DashboardPanel({ onClose }: { onClose: () => void }) {
  const summary = useDashboardSummary();
  const explain = useQuery({ queryKey: qk.dashboardExplain, queryFn: () => api.get<DashboardExplain>('/api/admin/dashboard/explain'), refetchInterval: 60_000 });
  const d = summary.data;
  const e = explain.data;

  return (
    <Card className="flex min-h-0 flex-col overflow-hidden">
      <CardHeader
        title="Dashboard"
        description="Pipes, wallets and today's movements"
        icon={<LayoutDashboard />}
        tone="gold"
        actions={
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-ink-900" aria-label="Close dashboard">
            <X className="size-4" />
          </button>
        }
      />

      <div className="scrollbar-thin min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {summary.isPending && <Skeleton className="h-28" />}
        {summary.isError && <Alert tone="danger">Couldn&apos;t load dashboard: {summary.error.message}</Alert>}
        {d && (
          <dl className="grid grid-cols-2 gap-2">
            {(
              [
                ['Total Pipe Balance', money(d.totalPipeBalance), 'text-ink-900'],
                ['Total Wallet Balance', money(d.totalWalletBalance), 'text-ink-900'],
                ['Wallets', count(d.walletCount), 'text-ink-900'],
                ['Difference', money(d.difference), d.difference >= 0 ? 'text-jade-600' : 'text-rose-600'],
              ] as const
            ).map(([label, value, tone]) => (
              <div key={label} className="rounded-xl border border-slate-200/80 bg-slate-50/50 px-3 py-2.5">
                <dt className="text-[10.5px] leading-tight font-bold tracking-wider text-slate-500 uppercase">{label}</dt>
                <dd className={cn('mt-0.5 truncate text-[15px] font-extrabold tabular', tone)} title={value}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        <div>
          <p className="mb-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase">Difference explained</p>
          {explain.isPending && <Skeleton className="h-40" />}
          {explain.isError && <Alert tone="danger">Couldn&apos;t load the explanation: {explain.error.message}</Alert>}
          {e && (
            <div className="rounded-xl border border-slate-200/80 px-3.5 py-3 text-[12.5px]">
              <dl className="space-y-1">
                <div className="flex justify-between gap-3 font-semibold text-ink-900">
                  <dt>Wallet balance ({e.walletCount} wallets)</dt>
                  <dd className="tabular">{money(e.walletBalance)}</dd>
                </div>
                <div className="flex justify-between gap-3 font-semibold text-ink-900">
                  <dt>Pipe balance</dt>
                  <dd className="tabular">{money(e.pipeBalance)}</dd>
                </div>
                <div className={cn('flex justify-between gap-3 font-extrabold', e.difference >= 0 ? 'text-jade-600' : 'text-rose-600')}>
                  <dt>Difference</dt>
                  <dd className="tabular">{money(e.difference)}</dd>
                </div>
              </dl>
              <p className="mt-2.5 mb-1 border-t border-slate-100 pt-2 text-[10.5px] font-bold tracking-wider text-slate-400 uppercase">Today</p>
              <dl className="space-y-0.5">
                {(
                  [
                    ['Card payments credited', e.today.pgCredit],
                    ['IMPS paid', e.today.impsSuccess],
                    ['IMPS failed', e.today.impsFailed],
                    ['IMPS refunded', e.today.impsRefund],
                    ['IMPS pending', e.today.impsPending],
                    ['Card bills paid', e.today.bbpsSuccess],
                    ['Card bills failed', e.today.bbpsFailed],
                    ['Card bills refunded', e.today.bbpsRefund],
                    ['Verification charges', e.today.verifyDebit],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3 text-slate-600">
                    <dt>{label}</dt>
                    <dd className="font-semibold text-ink-900 tabular">{money(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase">Payment Pipes</p>
          <div className="space-y-2">
            {d?.pipeBalances.map((pipe) => (
              <div key={pipe.pipeName} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-ink-900">{pipe.pipeName}</p>
                  <p className="truncate text-[11.5px] text-slate-500">{pipe.message}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[13px] font-bold text-ink-900 tabular">{money(pipe.balance)}</p>
                  <StatusBadge status={pipe.status} />
                </div>
              </div>
            ))}
            {d && d.pipeBalances.length === 0 && <p className="text-[12.5px] text-slate-500">No pipes reported.</p>}
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Admin — TamilPay's admin page in this portal's design:
 *   Overview & Reports  Dashboard (opens the panel) · Admin Ledger · Admin IMPS · Admin PG · Admin QR · Customer Business
 *   QR                  QR · QR Requests
 *   Manage              Customers · PG Settings · Announcements · Distributors
 * (Customers and PG Settings were in TamilPay's admin sidebar; this portal has no sidebar, so
 * they live here.) On a desktop the page is one screen tall:
 * the groups' rows stretch to share it and the Dashboard panel scrolls inside itself.
 */
export function AdminConsole() {
  const [dashOpen, setDashOpen] = useState(true);
  const [distributors, setDistributors] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const openDashboard = () => {
    setDashOpen(true);
    // On narrow screens the panel sits below the tools; bring it into view.
    requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const overview: Group = {
    key: 'overview',
    title: 'Overview & Reports',
    caption: "Balances, and every retailer's reports in one place",
    icon: LayoutDashboard,
    tools: [
      { label: 'Dashboard', description: 'Wallet and payment pipe balances at a glance', mark: icon3d('bar-chart'), onClick: openDashboard, active: dashOpen },
      { label: 'Admin Ledger Report', description: "Any retailer's wallet ledger over a date range", mark: icon3d('ledger'), href: routes.report('admin-ledger') },
      { label: 'Admin IMPS Report', description: "Every retailer's IMPS transfers, client-wide", mark: brand('imps.svg'), href: routes.report('admin-imps') },
      { label: 'Admin PG Report', description: "Every retailer's PG links, client-wide", mark: icon3d('card'), href: routes.report('admin-pg') },
      { label: 'Admin QR Report', description: "Every retailer's QR collect requests, client-wide", mark: brand('upi.svg'), href: routes.report('admin-qr') },
      { label: 'Customer Business', description: 'Day-wise PG, IMPS and card-bill business of every customer', mark: icon3d('office'), href: routes.report('customer-business') },
    ],
  };
  const qr: Group = {
    key: 'qr',
    title: 'QR',
    caption: 'Static QR codes and the requests made against them',
    icon: QrCode,
    tools: [
      { label: 'QR', description: 'Create and manage static QR codes', mark: icon3d('phone'), href: routes.qrCodes },
      { label: 'QR Requests', description: 'Approve or reject collect requests', mark: icon3d('inbox'), href: routes.qrRequests },
    ],
  };
  const manage: Group = {
    key: 'manage',
    title: 'Manage',
    caption: 'Customers, gateways, what everyone sees, and who distributes',
    icon: Settings,
    tools: [
      { label: 'Customers', description: 'Accounts, wallets, payout charges and credentials', mark: icon3d('people'), href: routes.customers },
      { label: 'PG Settings', description: 'Groups, categories, gateways and settlement charges', mark: icon3d('gear'), href: routes.pgSettings },
      { label: 'Announcements', description: 'Post updates every customer sees', mark: icon3d('megaphone'), href: routes.announcements },
      { label: 'Distributors', description: 'Add and manage distributors', mark: icon3d('handshake'), onClick: () => setDistributors(true) },
    ],
  };

  return (
    <div className="flex flex-col gap-4 xl:h-[calc(100dvh-var(--chrome-h))]">
      <PageHeader title="Admin" description="Reports, QR codes and the tools that run Indiyana Payments" back={routes.home} className="mb-0" />

      <div className={cn('grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2', dashOpen && 'xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(22.5rem,0.95fr)]')}>
        <GroupCard group={overview} />
        <div className="flex min-h-0 flex-col gap-4">
          <GroupCard group={qr} className="shrink-0" />
          <GroupCard group={manage} className="xl:flex-1" />
        </div>
        {dashOpen && (
          <div ref={panelRef} className="flex min-h-0 scroll-mt-24 flex-col lg:col-span-2 lg:max-xl:max-h-[36rem] xl:col-span-1">
            <DashboardPanel onClose={() => setDashOpen(false)} />
          </div>
        )}
      </div>

      <DistributorsDialog open={distributors} onClose={() => setDistributors(false)} />
    </div>
  );
}

'use client';

import { BarChart3, FileSpreadsheet, FileText } from 'lucide-react';
import { cn } from '@/lib/cn';
import { routes } from '@/config/routes';
import { ActionCard } from '@/components/ui/action-card';
import { Card, SectionHeading } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { useSession } from '@/features/auth/session-context';
import { buildReports, RETAILER_REPORT_KEYS } from './definitions';

/** Each report wears the mark of the service it reports on — the same marks as Home and Admin. */
const MARKS: Record<(typeof RETAILER_REPORT_KEYS)[number], { src: string; logo?: boolean }> = {
  transfers: { src: '/logos/imps.svg', logo: true },
  pg: { src: '/services/card.png' },
  'card-bills': { src: '/logos/bharat-billpay.svg', logo: true },
  ledger: { src: '/services/ledger.png' },
  qr: { src: '/logos/upi.svg', logo: true },
};

const EXPORTS = (
  <>
    <span className="inline-flex items-center gap-1 rounded-md bg-jade-50 px-1.5 py-0.5 text-[10.5px] font-bold text-jade-700">
      <FileSpreadsheet className="size-3" /> Excel
    </span>
    <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-[10.5px] font-bold text-rose-600">
      <FileText className="size-3" /> PDF
    </span>
  </>
);

/**
 * The five reports, as on TamilPay — the same list for every role. (The admin's client-wide
 * reports live on the Admin page, exactly where TamilPay kept them.) Built from the same pieces
 * as Admin: one card, the shared section heading, and an action row per report.
 */
export function ReportsMenu() {
  const { isAdmin } = useSession();
  const defs = buildReports(isAdmin);
  return (
    <div className="flex flex-col xl:h-[calc(100dvh-var(--chrome-h))]">
      <PageHeader eyebrow="Overview" title="Reports" description="Pick a report, choose a date range, then export it to Excel or PDF." back={routes.home} />
      <Card className="flex min-h-0 flex-col p-3 xl:flex-1">
        <SectionHeading title="Your reports" description="Everything that moved through your wallet, by service" icon={<BarChart3 />} className="mb-3 px-1" />
        <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-1 gap-2 lg:grid-cols-2">
          {RETAILER_REPORT_KEYS.map((key, i) => {
            const def = defs[key];
            if (!def) return null;
            return (
              <ActionCard
                key={key}
                title={def.label}
                description={def.description}
                mark={MARKS[key]}
                meta={EXPORTS}
                href={routes.report(key)}
                className={cn('h-full', i === RETAILER_REPORT_KEYS.length - 1 && 'lg:col-span-2')}
              />
            );
          })}
        </div>
      </Card>
    </div>
  );
}

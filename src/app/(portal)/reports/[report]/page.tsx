import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { ADMIN_REPORT_KEYS } from '@/features/reports/definitions';
import { ReportView } from '@/features/reports/report-view';
import { routes } from '@/config/routes';

export const metadata: Metadata = { title: 'Report' };

/** One report by its slug. Admin-wide reports are refused here for anyone else, as the API refuses them. */
export default async function ReportPage({ params }: { params: Promise<{ report: string }> }) {
  const { report } = await params;
  const user = await getSession();
  if ((ADMIN_REPORT_KEYS as readonly string[]).includes(report) && user?.role !== 'admin') redirect(routes.reports);
  return <ReportView key={report} reportKey={report} />;
}

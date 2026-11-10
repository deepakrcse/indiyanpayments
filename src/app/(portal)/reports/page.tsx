import type { Metadata } from 'next';
import { ReportsMenu } from '@/features/reports/reports-menu';

export const metadata: Metadata = { title: 'Reports' };

export default function ReportsPage() {
  return <ReportsMenu />;
}

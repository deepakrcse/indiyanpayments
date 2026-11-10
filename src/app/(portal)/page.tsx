import type { Metadata } from 'next';
import { HomeView } from '@/features/dashboard/home-view';

export const metadata: Metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return <HomeView />;
}

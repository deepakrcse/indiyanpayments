import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { MyRetailersView } from '@/features/distributors/my-retailers-view';
import { routes } from '@/config/routes';

export const metadata: Metadata = { title: 'My retailers' };

export default async function MyRetailersPage() {
  const user = await getSession();
  if (user?.role !== 'distributor') redirect(routes.home);
  return <MyRetailersView />;
}

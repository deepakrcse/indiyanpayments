import { redirect } from 'next/navigation';
import { getSession } from '@/server/auth/session';
import { routes } from '@/config/routes';

/** Admin-only pages. The API enforces the same rule on every admin route. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (user?.role !== 'admin') redirect(routes.home);
  return children;
}

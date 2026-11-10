import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { getSession } from '@/server/auth/session';
import { routes } from '@/config/routes';

/** Every signed-in page. The session is verified here on the server, not just in the proxy. */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect(routes.login);
  return (
    <AppShell user={user}>
      {children}
    </AppShell>
  );
}

'use client';

import type { CSSProperties, ReactNode } from 'react';
import { AnnouncementCenter } from '@/features/announcements/announcement-center';
import { SessionProvider } from '@/features/auth/session-context';
import type { SessionUser } from '@/types/auth';
import { NavigationHistoryProvider } from './navigation-history';
import { Topbar } from './topbar';

/**
 * The signed-in frame: a top bar (logo → dashboard, wallet balance, announcements, account) and
 * the page. There is no side navigation — the dashboard's tiles are the menu, every page has a
 * Back button, and Profile lives in the account menu.
 */
export function AppShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  return (
    <SessionProvider user={user}>
      <NavigationHistoryProvider>
        <AnnouncementCenter>
          {/* --chrome-h is everything above the page (the top bar and its 1px border + main's vertical padding),
              so a page can size itself to exactly one screen: h-[calc(100dvh-var(--chrome-h))]. */}
          <div className="canvas-grid flex min-h-dvh flex-col" style={{ '--chrome-h': 'calc(7.5rem + 1px)' } as CSSProperties}>
            <Topbar />
            <main className="mx-auto w-full max-w-400 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
          </div>
        </AnnouncementCenter>
      </NavigationHistoryProvider>
    </SessionProvider>
  );
}

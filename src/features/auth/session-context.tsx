'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { routes } from '@/config/routes';
import type { SessionUser } from '@/types/auth';

interface SessionValue {
  user: SessionUser;
  isAdmin: boolean;
  isDistributor: boolean;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

/**
 * The signed-in user, handed down from the server layout (so there is no flash of a signed-out
 * shell). A tab left open past midnight signs itself out: the session is re-checked every 30s and
 * on returning to the tab — polled rather than one long timer, because timers stall while a
 * laptop sleeps.
 */
export function SessionProvider({ user, children }: { user: SessionUser; children: ReactNode }) {
  const [current] = useState(user);
  const queryClient = useQueryClient();

  const leave = useCallback(() => {
    queryClient.clear();
    window.location.assign(routes.login);
  }, [queryClient]);

  const signOut = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      leave();
    }
  }, [leave]);

  useEffect(() => {
    const check = () => {
      api
        .get<{ user: SessionUser | null }>('/api/auth/session')
        .then(({ user: live }) => {
          if (!live || live.customerId !== current.customerId) leave();
        })
        .catch(() => {});
    };
    const timer = setInterval(check, 30_000);
    const onVisible = () => document.visibilityState === 'visible' && check();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [current.customerId, leave]);

  return (
    <SessionContext.Provider value={{ user: current, isAdmin: current.role === 'admin', isDistributor: current.role === 'distributor', signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}

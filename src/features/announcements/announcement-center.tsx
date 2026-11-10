'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Megaphone, Sparkles } from 'lucide-react';
import { api } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { dateTime } from '@/lib/format';
import { routes } from '@/config/routes';
import { useSession } from '@/features/auth/session-context';
import type { Announcement } from '@/types/admin';
import { addKnownIds, knownIds, markShownToday, shownToday } from './seen-store';

interface AnnouncementsValue {
  items: Announcement[];
  openAll: () => void;
}

const Ctx = createContext<AnnouncementsValue>({ items: [], openAll: () => {} });
export const useAnnouncements = () => useContext(Ctx);

/**
 * Announcements for every signed-in user, re-checked every 20 seconds so a new one shows up
 * without a reload. The popup is queued, not forced: it opens while the person is on the
 * dashboard, and otherwise waits until they get back there.
 */
export function AnnouncementCenter({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const pathname = usePathname();
  const [queue, setQueue] = useState<Announcement[]>([]);
  const [popup, setPopup] = useState<Announcement[] | null>(null);
  const firstLoad = useRef(true);

  const { data: items = [] } = useQuery({
    queryKey: qk.announcements('active'),
    queryFn: () => api.get<Announcement[]>('/api/announcements'),
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  });

  // Queue what should pop up: everything the first time today, afterwards anything not yet shown.
  useEffect(() => {
    if (items.length === 0) return;
    const known = knownIds(user.customerId);
    const pending = firstLoad.current && !shownToday(user.customerId) ? items : items.filter((a) => !known.has(a.id));
    firstLoad.current = false;
    if (pending.length === 0) return;
    setQueue((prev) => {
      const byId = new Map(prev.map((a) => [a.id, a]));
      pending.forEach((a) => byId.set(a.id, a));
      return [...byId.values()];
    });
  }, [items, user.customerId]);

  // Open the queued popup once the person is on the dashboard.
  useEffect(() => {
    if (pathname !== routes.home || popup || queue.length === 0) return;
    addKnownIds(user.customerId, queue.map((a) => a.id));
    markShownToday(user.customerId);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- moving the queue into the open popup
    setPopup(queue);
    setQueue([]);
  }, [pathname, popup, queue, user.customerId]);

  const value = useMemo(
    () => ({
      items,
      openAll: () => {
        if (items.length) setPopup(items);
      },
    }),
    [items],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <Dialog open={Boolean(popup?.length)} onClose={() => setPopup(null)} size="lg" hideClose className="overflow-hidden">
        {popup && (
          <div className="-mx-6 -mt-3 -mb-6">
            <div className="bg-aurora relative overflow-hidden px-6 pt-7 pb-8 text-white">
              <Sparkles className="absolute top-5 right-8 size-5 animate-float text-gold-400" aria-hidden />
              <span className="relative grid size-14 place-items-center rounded-2xl bg-white/12 ring-1 ring-white/20 backdrop-blur">
                <span className="absolute inset-0 animate-ping-slow rounded-2xl bg-white/10" aria-hidden />
                <Megaphone className="size-7" />
              </span>
              <h2 className="mt-4 text-xl font-extrabold">What&apos;s new</h2>
              <p className="mt-1 text-sm text-brand-100">
                {popup.length === 1 ? '1 update' : `${popup.length} updates`} from Indiyan Payments
              </p>
            </div>
            <ol className="scrollbar-thin max-h-[50vh] space-y-3 overflow-y-auto px-6 py-5">
              {popup.map((a, i) => (
                <li key={a.id} className="flex animate-rise gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4" style={{ animationDelay: `${i * 60}ms` }}>
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">{i + 1}</span>
                  <div className="min-w-0">
                    <h3 className="font-bold text-ink-900">{a.title}</h3>
                    <p className="mt-1 text-[13.5px] leading-relaxed whitespace-pre-line text-slate-600">{a.message}</p>
                    {a.createdTime && <time className="mt-2 block text-[11.5px] font-medium text-slate-400">{dateTime(a.createdTime)}</time>}
                  </div>
                </li>
              ))}
            </ol>
            <div className="border-t border-slate-100 px-6 py-4">
              <Button block onClick={() => setPopup(null)}>
                Got it <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </Ctx.Provider>
  );
}

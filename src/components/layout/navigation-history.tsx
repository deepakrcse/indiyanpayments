'use client';

import { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * Remembers this tab's trail through the portal so every page's Back agrees with the browser's:
 * when the person got here from another screen of the app, Back steps back to exactly that screen
 * (same filters); when the page was opened directly (a refresh, a shared link) there is nothing to
 * step back to, so Back goes to the page's usual parent.
 *
 * Going to the dashboard from the logo (or Profile from the account menu) starts a fresh trail, so
 * Back never walks through a long chain of earlier screens one at a time.
 */
interface History {
  markTopLevel: () => void;
  canGoBack: () => boolean;
}

const HistoryContext = createContext<History | null>(null);

/**
 * Records each address. Kept in its own Suspense boundary (it reads the search params), so the
 * pages themselves are never suspended — their redirects and 404s keep real status codes.
 */
function PathTracker({ trailRef, topLevelRef }: { trailRef: RefObject<string[]>; topLevelRef: RefObject<boolean> }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => {
    const here = search ? `${pathname}?${search}` : pathname;
    const t = trailRef.current;
    if (topLevelRef.current) {
      trailRef.current = [here];
      topLevelRef.current = false;
    } else if (t.length >= 2 && t[t.length - 2] === here) {
      t.pop(); // a step back (ours or the browser's)
    } else if (t[t.length - 1] !== here) {
      t.push(here);
    }
  }, [pathname, search, trailRef, topLevelRef]);

  return null;
}

export function NavigationHistoryProvider({ children }: { children: ReactNode }) {
  const trail = useRef<string[]>([]);
  const topLevelNext = useRef(false);

  const markTopLevel = useCallback(() => {
    topLevelNext.current = true;
  }, []);
  const canGoBack = useCallback(() => trail.current.length > 1, []);
  const value = useMemo(() => ({ markTopLevel, canGoBack }), [markTopLevel, canGoBack]);

  return (
    <HistoryContext.Provider value={value}>
      <Suspense fallback={null}>
        <PathTracker trailRef={trail} topLevelRef={topLevelNext} />
      </Suspense>
      {children}
    </HistoryContext.Provider>
  );
}

export function useNavigationHistory() {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error('useNavigationHistory must be used inside NavigationHistoryProvider');
  return ctx;
}

/** `goBack(fallback)`: the previous in-app screen if there is one, otherwise `fallback`. */
export function useBack() {
  const router = useRouter();
  const ctx = useContext(HistoryContext);
  return useCallback(
    (fallback: string) => {
      if (ctx?.canGoBack()) router.back();
      else router.push(fallback);
    },
    [ctx, router],
  );
}

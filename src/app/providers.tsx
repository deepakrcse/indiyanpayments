'use client';

import { useState, type ReactNode } from 'react';
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ApiClientError } from '@/lib/api/client';

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            refetchOnWindowFocus: false,
            // A 4xx is an answer, not a blip — retrying it only delays the message.
            retry: (failures, err) => !(err instanceof ApiClientError && err.status >= 400 && err.status < 500) && failures < 1,
          },
        },
        mutationCache: new MutationCache(),
      }),
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster position="top-right" richColors closeButton toastOptions={{ className: 'font-sans' }} />
    </QueryClientProvider>
  );
}

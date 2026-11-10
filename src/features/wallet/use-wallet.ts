'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { api } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import type { Wallet } from '@/types/wallet';

/** The signed-in user's live wallet. Refetched on focus, since balances move elsewhere too. */
export function useWallet() {
  return useQuery({
    queryKey: qk.wallet,
    queryFn: () => api.get<Wallet>('/api/me/wallet'),
    refetchOnWindowFocus: true,
    staleTime: 5_000,
  });
}

/**
 * Call after anything that moves money (a transfer, a payment, a top-up): every figure derived
 * from wallet balances — the top bar, the dashboard, ledgers — reloads.
 */
export function useMoneyMoved() {
  const qc = useQueryClient();
  return useCallback(() => {
    qc.invalidateQueries({ queryKey: qk.wallet });
    qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    qc.invalidateQueries({ queryKey: ['ledger'] });
    qc.invalidateQueries({ queryKey: ['customers'] });
    qc.invalidateQueries({ queryKey: qk.todayTransfers });
  }, [qc]);
}

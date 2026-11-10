'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import type { DashboardSummary } from '@/types/admin';

/**
 * Admin only: pipe balance, wallet balance, wallet count, difference and each pipe's balance,
 * refreshed every 30 seconds. Shared by Home's greeting bar and the Admin page's Dashboard panel,
 * so both read one cached copy.
 */
export function useDashboardSummary(enabled = true) {
  return useQuery({
    queryKey: qk.dashboard,
    queryFn: () => api.get<DashboardSummary>('/api/admin/dashboard'),
    refetchInterval: 30_000,
    enabled,
  });
}

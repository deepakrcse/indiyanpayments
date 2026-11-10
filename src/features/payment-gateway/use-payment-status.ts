'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { PaymentStatus } from '@/types/pg';

const POLL_MS = 6_000;
const MAX_POLLS = 20;

/**
 * Looks a payment up by the redirect token or a reference, and keeps looking while it is still
 * pending — the gateway often sends the payer back a moment before the vendor settles the result.
 */
export function usePaymentStatus({ token, reference }: { token?: string | null; reference?: string | null }) {
  return useQuery({
    queryKey: ['pg', 'status', token ?? null, reference ?? null],
    queryFn: () => api.get<PaymentStatus>('/api/pg/status', token ? { token } : { referenceId: reference }),
    enabled: Boolean(token || reference),
    retry: false,
    refetchInterval: (q) => (q.state.data?.outcome === 'pending' && q.state.dataUpdateCount < MAX_POLLS ? POLL_MS : false),
  });
}

export const OUTCOME_TITLES = {
  success: 'Payment successful',
  failed: 'Payment failed',
  pending: 'Payment pending',
} as const;

/** The labelled values a result shows — never charges or GST. */
export function statusRows(status: PaymentStatus | undefined, withBalance = false): [string, string][] {
  if (!status) return [];
  const money = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const rows: [string, string | null][] = [
    [status.outcome === 'success' ? 'Amount debited' : 'Amount', status.amount != null ? money(status.amount) : null],
    ['UTR', status.utr],
    ['Card', status.cardNumber ? `•••• ${status.cardNumber}` : null],
    ['Balance after credit', withBalance && status.closingBalance != null ? money(status.closingBalance) : null],
    ['Reference', status.referenceId],
  ];
  return rows.filter((r): r is [string, string] => Boolean(r[1]));
}

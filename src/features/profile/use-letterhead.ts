'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import type { Letterhead } from '@/lib/export/pdf';
import { useSession } from '@/features/auth/session-context';
import type { Customer } from '@/types/customer';

/** The signed-in user's full record (the session does not carry the store address). */
export function useProfile() {
  return useQuery({ queryKey: qk.profile, queryFn: () => api.get<Customer>('/api/me/profile'), staleTime: 5 * 60_000 });
}

/** The store letterhead printed on receipts and report PDFs. */
export function useLetterhead(): Letterhead {
  const { user } = useSession();
  const { data } = useProfile();
  return {
    storeName: data?.storeName || user.storeName || user.fullName,
    storeAddress: data?.storeAddress ?? '',
    contact: data?.mobileNumber || user.mobileNumber,
  };
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import type { Customer, CustomerWithWallet, RetailerOption, RoleOption } from '@/types/customer';
import type { Wallet } from '@/types/wallet';

export const useCustomers = () => useQuery({ queryKey: qk.customers, queryFn: () => api.get<Customer[]>('/api/customers') });

/** Customers with each one's live wallet, in one request. */
export const useCustomersWithWallets = () =>
  useQuery({ queryKey: [...qk.customers, 'wallets'], queryFn: () => api.get<CustomerWithWallet[]>('/api/customers', { include: 'wallets' }) });

export const useCustomer = (id: number | null) =>
  useQuery({ queryKey: qk.customer(id ?? 0), queryFn: () => api.get<Customer>(`/api/customers/${id}`), enabled: Boolean(id) });

export const useRoles = () => useQuery({ queryKey: qk.roles, queryFn: () => api.get<RoleOption[]>('/api/roles'), staleTime: 60 * 60_000 });

export const useRetailers = (enabled = true) => useQuery({ queryKey: qk.retailers, queryFn: () => api.get<RetailerOption[]>('/api/retailers'), enabled });

export const fetchCustomerWallet = (id: number) => api.get<Wallet>(`/api/customers/${id}/wallet`);

export const roleOf = (c: { roleName: string }) => {
  const r = c.roleName.trim().toLowerCase();
  return r === 'admin' ? 'admin' : r === 'retailer' ? 'retailer' : /^distributors?$/.test(r) ? 'distributor' : 'other';
};

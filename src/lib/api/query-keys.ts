/**
 * Every TanStack Query key in one place, so invalidation after a mutation can't drift from the
 * key a screen reads with. `wallet` is invalidated after anything that moves money, which is
 * what keeps the top-bar balance, the home card and the ledger in step.
 */
export const qk = {
  wallet: ['me', 'wallet'] as const,
  profile: ['me', 'profile'] as const,
  myRetailers: ['me', 'retailers'] as const,
  announcements: (scope: 'active' | 'all') => ['announcements', scope] as const,
  customers: ['customers'] as const,
  customer: (id: number) => ['customers', id] as const,
  customerWallet: (id: number) => ['customers', id, 'wallet'] as const,
  mapping: (id: number) => ['customers', id, 'mapping'] as const,
  retailers: ['retailers'] as const,
  roles: ['roles'] as const,
  client: ['client'] as const,
  banks: ['banks'] as const,
  allBankAccounts: ['bank-accounts', 'all'] as const,
  bankAccounts: (mobile: string) => ['bank-accounts', mobile] as const,
  todayTransfers: ['transfers', 'today'] as const,
  ledger: (walletId: number | null, from: string, to: string) => ['ledger', walletId, from, to] as const,
  gateways: ['pg', 'gateways'] as const,
  billers: ['bbps', 'billers'] as const,
  dashboard: ['admin', 'dashboard'] as const,
  dashboardExplain: ['admin', 'dashboard', 'explain'] as const,
  dashboardLog: (from: string, to: string) => ['admin', 'dashboard', 'log', from, to] as const,
  pgGroups: ['pg-settings', 'groups'] as const,
  pgCategories: ['pg-settings', 'categories'] as const,
  pgGateways: ['pg-settings', 'gateways'] as const,
  qrCodes: ['qr', 'codes'] as const,
  qrPending: ['qr', 'pending'] as const,
  qrAll: ['qr', 'all'] as const,
  report: (key: string, params: Record<string, unknown>) => ['report', key, params] as const,
};

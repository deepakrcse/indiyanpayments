'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRightLeft,
  BarChart3,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  HandCoins,
  Network,
  Pencil,
  Plus,
  Receipt,
  Trash2,
  UserCheck,
  Users,
  Wallet,
  WalletCards,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { count, rupees } from '@/lib/format';
import { sanitizeAmount } from '@/lib/validation/patterns';
import { routes } from '@/config/routes';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Alert, EmptyState, LoadingRows } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/page-header';
import { RowMenu } from '@/components/ui/row-menu';
import { SearchInput } from '@/components/ui/search-input';
import { StatCard } from '@/components/ui/stat-card';
import { SegmentedTabs } from '@/components/ui/tabs';
import { Table, TD, TH, THead, TR } from '@/components/ui/table';
import { useSession } from '@/features/auth/session-context';
import type { CustomerWithWallet } from '@/types/customer';
import type { Wallet as WalletT } from '@/types/wallet';
import { roleOf, useCustomersWithWallets } from './api';
import { PullbackDialog } from './pullback-dialog';
import { TransferDialog } from './transfer-dialog';

const PAGE_SIZE = 15;
type RoleFilter = 'all' | 'retailer' | 'distributor' | 'admin';

/** The wallet-based reports a row's menu opens for that one customer. */
const CUSTOMER_REPORTS = [
  { key: 'transfers', label: 'IMPS transfers', icon: Receipt },
  { key: 'pg', label: 'Card collections', icon: CreditCard },
  { key: 'card-bills', label: 'Credit card bills', icon: WalletCards },
  { key: 'ledger', label: 'Wallet ledger', icon: BookOpen },
];

function PayoutCell({ customer }: { customer: CustomerWithWallet }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const save = useMutation({
    mutationFn: (payoutCharges: number) => api.put<WalletT>(`/api/customers/${customer.id}/wallet/payout-charges`, { payoutCharges }),
    onSuccess: (wallet) => {
      qc.setQueryData<CustomerWithWallet[]>([...qk.customers, 'wallets'], (list) => list?.map((c) => (c.id === customer.id ? { ...c, wallet } : c)));
      setEditing(false);
      toast.success('Payout charge updated');
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (!customer.wallet) return <span className="text-slate-300">—</span>;
  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setValue(String(customer.wallet!.payoutCharges ?? ''));
          setEditing(true);
        }}
        className="group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-semibold text-ink-900 tabular hover:bg-brand-50"
        title="Edit payout charge"
      >
        {Number(customer.wallet.payoutCharges).toFixed(4)}
        <Pencil className="size-3 text-slate-300 group-hover:text-brand-600" />
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <input
        autoFocus
        inputMode="decimal"
        aria-label="Payout charge"
        value={value}
        onChange={(e) => {
          const v = sanitizeAmount(e.target.value, 4);
          if (v !== null) setValue(v);
        }}
        onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
        className="h-8 w-24 rounded-lg border border-brand-300 px-2 text-[13px] tabular outline-none focus:ring-4 focus:ring-brand-500/12"
      />
      <button
        type="button"
        disabled={save.isPending}
        onClick={() => {
          const n = Number(value);
          if (value === '' || !Number.isFinite(n) || n < 0) return toast.error('Enter a valid payout charge.');
          save.mutate(n);
        }}
        className="grid size-8 place-items-center rounded-lg bg-jade-50 text-jade-600 hover:bg-jade-100"
        aria-label="Save"
      >
        <Check className="size-4" />
      </button>
      <button type="button" onClick={() => setEditing(false)} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100" aria-label="Cancel">
        <X className="size-4" />
      </button>
    </div>
  );
}

/** Everyone on the client: wallets, payouts, transfers, and each customer's reports. */
export function CustomersView() {
  const router = useRouter();
  const qc = useQueryClient();
  const { isAdmin } = useSession();
  const customers = useCustomersWithWallets();
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<RoleFilter>('all');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<CustomerWithWallet | null>(null);
  const [transferTo, setTransferTo] = useState<CustomerWithWallet | null>(null);
  const [pullFrom, setPullFrom] = useState<CustomerWithWallet | null>(null);

  const list = useMemo(() => customers.data ?? [], [customers.data]);
  const counts = useMemo(
    () => ({
      all: list.length,
      retailer: list.filter((c) => roleOf(c) === 'retailer').length,
      distributor: list.filter((c) => roleOf(c) === 'distributor').length,
      admin: list.filter((c) => roleOf(c) === 'admin').length,
    }),
    [list],
  );
  const withWallet = list.filter((c) => c.wallet);
  const totalBalance = withWallet.reduce((s, c) => s + (c.wallet?.currentBalance ?? 0), 0);

  const needle = query.trim().toLowerCase();
  const filtered = list.filter((c) => {
    if (role !== 'all' && roleOf(c) !== role) return false;
    if (!needle) return true;
    return [c.fullName, c.mobileNumber, c.pan, c.email, c.storeName].some((v) => v.toLowerCase().includes(needle));
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const refresh = () => qc.invalidateQueries({ queryKey: qk.customers });

  const addWallet = useMutation({
    mutationFn: (id: number) => api.post(`/api/customers/${id}/wallet`),
    onSuccess: () => {
      toast.success('Wallet added');
      refresh();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.del(`/api/customers/${id}`),
    onSuccess: () => {
      toast.success('Customer deleted');
      setDeleting(null);
      refresh();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const openReport = (c: CustomerWithWallet, key: string) => {
    if (!c.wallet) return;
    router.push(`${routes.report(key)}?walletId=${c.wallet.walletId}&customer=${encodeURIComponent(c.fullName)}`);
  };

  return (
    <div className="flex flex-col xl:h-[calc(100dvh-var(--chrome-h))]">
      <PageHeader
        eyebrow="Admin"
        title="Customers"
        description="Everyone on your account — wallets, payouts and reports in one place."
        back={routes.admin}
        actions={
          <Link href={routes.newCustomer} className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-[0_6px_18px_-6px_rgb(2_44_113/0.55)] hover:bg-brand-700">
            <Plus className="size-4" /> Add customer
          </Link>
        }
      />

      <div className="mb-4 grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total customers" value={count(list.length)} icon={<Users />} tone="brand" loading={customers.isPending} />
        <StatCard label="Retailers" value={count(counts.retailer)} icon={<UserCheck />} tone="gold" loading={customers.isPending} />
        <StatCard label="With a wallet" value={count(withWallet.length)} icon={<Wallet />} tone="jade" loading={customers.isPending} />
        <StatCard label="Total wallet balance" value={rupees(totalBalance)} icon={<CreditCard />} tone="sky" loading={customers.isPending} />
      </div>

      <Card className="flex min-h-0 flex-col overflow-hidden xl:flex-1">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <SegmentedTabs<RoleFilter>
            label="Filter by role"
            value={role}
            onChange={(v) => {
              setRole(v);
              setPage(1);
            }}
            items={[
              { value: 'all', label: 'All', count: counts.all },
              { value: 'retailer', label: 'Retailers', count: counts.retailer },
              { value: 'distributor', label: 'Distributors', count: counts.distributor },
              { value: 'admin', label: 'Admins', count: counts.admin },
            ]}
          />
          <SearchInput
            value={query}
            onChange={(v) => {
              setQuery(v);
              setPage(1);
            }}
            placeholder="Search name, mobile, PAN, email or store"
            size="sm"
            className="w-full sm:w-80"
          />
        </div>

        {customers.isPending && <LoadingRows rows={6} />}
        {customers.isError && <Alert tone="danger" className="m-4">Couldn&apos;t load customers: {customers.error.message}</Alert>}
        {customers.isSuccess && list.length === 0 && (
          <EmptyState icon={<Users />} title="No customers yet" action={<Link href={routes.newCustomer} className="text-sm font-bold text-brand-600">Add the first one →</Link>} />
        )}
        {customers.isSuccess && list.length > 0 && filtered.length === 0 && <EmptyState icon={<Users />} title="No customers match">Try a different name, number or filter.</EmptyState>}

        {rows.length > 0 && (
          <Table className="min-h-0 flex-1">
            <THead>
              <tr>
                <TH>Customer</TH>
                <TH>PAN</TH>
                <TH align="right">Wallet</TH>
                <TH>Money</TH>
                <TH>Payout charge</TH>
                <TH align="right">Manage</TH>
              </tr>
            </THead>
            <tbody>
              {rows.map((c) => {
                const r = roleOf(c);
                return (
                  <TR key={c.id}>
                    <TD>
                      <div className="flex items-center gap-3">
                        <Avatar name={c.fullName} size={38} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Link href={routes.customer(c.id)} className="truncate font-bold text-ink-900 hover:text-brand-700">
                              {c.fullName}
                            </Link>
                            {c.roleName && <Badge tone={r === 'admin' ? 'dark' : r === 'distributor' ? 'brand' : 'neutral'}>{c.roleName}</Badge>}
                          </div>
                          <p className="truncate text-[12px] text-slate-500">
                            +91 {c.mobileNumber}
                            {c.storeName ? ` · ${c.storeName}` : ''}
                          </p>
                        </div>
                      </div>
                    </TD>
                    <TD className="font-mono text-[12.5px]">{c.pan}</TD>
                    <TD align="right">
                      {c.wallet ? (
                        <span className="font-bold text-ink-900">{rupees(c.wallet.currentBalance)}</span>
                      ) : c.hasWallet ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <Button size="xs" variant="secondary" onClick={() => addWallet.mutate(c.id)} loading={addWallet.isPending && addWallet.variables === c.id}>
                          <Wallet className="size-3.5" /> Add wallet
                        </Button>
                      )}
                    </TD>
                    <TD>
                      {c.wallet ? (
                        <div className="flex gap-1.5">
                          <Button size="xs" variant="outline" onClick={() => setTransferTo(c)}>
                            <ArrowRightLeft className="size-3.5" /> Transfer
                          </Button>
                          {isAdmin && r === 'retailer' && (
                            <Button size="xs" variant="outline" className="text-rose-600 hover:border-rose-300 hover:bg-rose-50" onClick={() => setPullFrom(c)}>
                              <HandCoins className="size-3.5" /> Pull back
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </TD>
                    <TD>
                      <PayoutCell customer={c} />
                    </TD>
                    <TD align="right">
                      <div className="inline-flex items-center gap-1">
                        {r === 'distributor' && c.hasWallet && (
                          <Link href={routes.mapping(c.id)} className="inline-flex h-8 items-center gap-1 rounded-lg bg-brand-50 px-2.5 text-[12px] font-bold text-brand-700 hover:bg-brand-100" title="View mapping">
                            <Network className="size-3.5" /> Mapping
                          </Link>
                        )}
                        <Link href={routes.customer(c.id)} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-brand-50 hover:text-brand-600" title="View" aria-label={`View ${c.fullName}`}>
                          <Eye className="size-4" />
                        </Link>
                        <Link href={routes.editCustomer(c.id)} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-brand-50 hover:text-brand-600" title="Edit" aria-label={`Edit ${c.fullName}`}>
                          <Pencil className="size-4" />
                        </Link>
                        {c.wallet ? (
                          <RowMenu
                            label={`Reports for ${c.fullName}`}
                            actions={[
                              ...CUSTOMER_REPORTS.map((rep) => ({ label: rep.label, icon: rep.icon, onSelect: () => openReport(c, rep.key) })),
                              { label: 'Delete customer', icon: Trash2, danger: true, onSelect: () => setDeleting(c) },
                            ]}
                          />
                        ) : (
                          <button type="button" onClick={() => setDeleting(c)} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Delete" aria-label={`Delete ${c.fullName}`}>
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </tbody>
          </Table>
        )}

        {filtered.length > 0 && (
          <div className="mt-auto flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-2.5 text-[12.5px] text-slate-500">
            <span>
              Showing {(current - 1) * PAGE_SIZE + 1}–{Math.min(current * PAGE_SIZE, filtered.length)} of {filtered.length}
              {filtered.length !== list.length ? ` (filtered from ${list.length})` : ''}
            </span>
            {pageCount > 1 && (
              <div className="flex items-center gap-2">
                <Button size="icon-sm" variant="outline" onClick={() => setPage(current - 1)} disabled={current === 1} aria-label="Previous page">
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="font-semibold text-ink-800">
                  Page {current} of {pageCount}
                </span>
                <Button size="icon-sm" variant="outline" onClick={() => setPage(current + 1)} disabled={current === pageCount} aria-label="Next page">
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      <p className="mt-3 flex shrink-0 items-center gap-1.5 text-[12px] text-slate-500">
        <BarChart3 className="size-3.5" /> Open a customer&apos;s reports from the ••• menu on their row.
      </p>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => !remove.isPending && setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        busy={remove.isPending}
        title="Delete customer"
        confirmLabel="Delete"
      >
        Are you sure you want to delete <strong className="text-ink-900">{deleting?.fullName}</strong>? This permanently removes the record and can&apos;t be undone.
      </ConfirmDialog>
      <TransferDialog target={transferTo} onClose={() => setTransferTo(null)} />
      <PullbackDialog target={pullFrom} onClose={() => setPullFrom(null)} />
    </div>
  );
}

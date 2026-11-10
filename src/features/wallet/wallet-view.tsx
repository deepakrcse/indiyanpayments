'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Landmark, Search, Wallet } from 'lucide-react';
import { api } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { todayIso } from '@/lib/dates';
import { rupees } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Card, CardHeader } from '@/components/ui/card';
import { DateRangeFields } from '@/components/ui/date-range';
import { Alert, EmptyState, LoadingRows } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/page-header';
import { Table, TD, TH, THead, TR } from '@/components/ui/table';
import { useSession } from '@/features/auth/session-context';
import { PaymentResultDialog } from '@/features/payment-gateway/payment-result-dialog';
import type { BankAccount } from '@/types/imps';
import type { LedgerEntry } from '@/types/wallet';
import { LedgerTable } from './ledger-table';
import { useMoneyMoved, useWallet } from './use-wallet';

/**
 * Wallet & Settlement, as on TamilPay — where the money lives and moves, in three parts:
 *   1. the wallet balance;
 *   2. settlement bank accounts (admins only) — every customer's linked account on the client,
 *      since there is no separate settlement-account concept upstream;
 *   3. the wallet ledger for a date range (today by default; change the dates and press Search).
 * Arriving from the payment gateway (?t=…), the payment's result opens as a popup first.
 */
export function WalletView() {
  const { user, isAdmin } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  // The gateway's token is read once and then dropped from the address, so a refresh does not repeat the popup.
  const searchParams = useSearchParams();
  const [paymentToken] = useState(() => searchParams.get('t')?.trim() || '');
  const wallet = useWallet();
  const moneyMoved = useMoneyMoved();

  const [range, setRange] = useState({ fromDate: todayIso(), toDate: todayIso() });
  const [applied, setApplied] = useState(range);

  const ledger = useQuery({
    queryKey: qk.ledger(user.walletId, applied.fromDate, applied.toDate),
    queryFn: () => api.get<LedgerEntry[]>('/api/ledger', applied),
    enabled: user.walletId > 0,
  });

  const accounts = useQuery({
    queryKey: qk.allBankAccounts,
    queryFn: () => api.get<BankAccount[]>('/api/bank-accounts/all'),
    enabled: isAdmin,
  });

  // Search always reloads, even with unchanged dates — as on TamilPay.
  const search = () => (range.fromDate === applied.fromDate && range.toDate === applied.toDate ? void ledger.refetch() : setApplied(range));

  const balance = (
    <section className="bg-aurora relative flex items-center gap-2.5 overflow-hidden rounded-xl py-1.5 pr-1.5 pl-2 text-white shadow-card">
      <div className="pointer-events-none absolute -top-8 -right-6 size-20 rounded-full bg-gold-500/25 blur-2xl" aria-hidden />
      <span className="relative grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 ring-1 ring-white/15">
        <Wallet className="size-4 text-gold-400" />
      </span>
      <div className="relative min-w-0">
        <p className="text-[9.5px] leading-none font-bold tracking-[0.14em] text-brand-200 uppercase">Wallet Balance</p>
        {wallet.isError ? (
          <p className="text-[13px] text-rose-200">Couldn&apos;t load: {wallet.error.message}</p>
        ) : (
          <p className="mt-0.5 text-[15px] leading-tight font-extrabold tabular">
            {wallet.isPending ? <span className="skeleton inline-block h-4 w-24 rounded opacity-30" /> : rupees(wallet.data?.currentBalance)}
          </p>
        )}
      </div>
      <RefreshButton onRefresh={() => wallet.refetch()} title="Refresh balance" variant="onDark" className="relative ml-1 size-7" iconClassName="[&_svg]:size-3.5" />
    </section>
  );

  return (
    // On a desktop the page is exactly one screen: the header row, then the cards share the rest,
    // and long tables scroll inside their own card.
    <div className="flex flex-col gap-4 lg:h-[calc(100dvh-var(--chrome-h))]">
      <PageHeader title="Wallet & Settlement" className="mb-0 items-center" actions={balance} />

      {paymentToken && <PaymentResultDialog token={paymentToken} onSuccess={moneyMoved} onDone={() => router.replace(pathname)} />}

      {/* ── Settlement bank accounts (admins only) — up to 40% of the height ── */}
      {isAdmin && (
        <Card className="flex min-h-0 shrink-0 flex-col overflow-hidden lg:max-h-[40%]">
          <CardHeader title="Settlement Bank Accounts" icon={<Landmark />} />
          {accounts.isPending && <LoadingRows rows={3} />}
          {accounts.isError && (
            <Alert tone="danger" className="m-5">
              Couldn&apos;t load bank accounts: {accounts.error.message}
            </Alert>
          )}
          {accounts.isSuccess && accounts.data.length === 0 && <EmptyState icon={<Landmark />} title="No settlement accounts on file." className="py-6" />}
          {accounts.data && accounts.data.length > 0 && (
            <Table className="min-h-0 flex-1">
              <THead>
                <tr>
                  <TH>Account Holder</TH>
                  <TH>Account Number</TH>
                  <TH>IFSC</TH>
                  <TH>Bank</TH>
                </tr>
              </THead>
              <tbody>
                {accounts.data.map((a) => (
                  <TR key={a.id}>
                    <TD className="font-semibold text-ink-900">{a.accountHolderName || '—'}</TD>
                    <TD className="font-mono text-[12.5px]">{a.accountNumber || '—'}</TD>
                    <TD className="font-mono text-[12.5px]">{a.ifsc || '—'}</TD>
                    <TD>{a.bankName || '—'}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      {/* ── Wallet ledger — fills whatever is left ── */}
      <Card className="flex min-h-96 flex-col overflow-hidden lg:min-h-0 lg:flex-1">
        <CardHeader
          title="Wallet Ledger"
          icon={<BookOpen />}
          actions={
            <div className="flex flex-wrap items-end gap-3">
              <DateRangeFields fromDate={range.fromDate} toDate={range.toDate} onChange={setRange} />
              <Button size="sm" className="h-10" onClick={search} loading={ledger.isFetching && !ledger.isLoading}>
                <Search className="size-4" /> Search
              </Button>
            </div>
          }
        />
        {user.walletId <= 0 && (
          <Alert tone="warning" className="m-5">
            No wallet is linked to this account yet.
          </Alert>
        )}
        {ledger.isLoading && <LoadingRows />}
        {ledger.isError && (
          <Alert tone="danger" className="m-5">
            Couldn&apos;t load ledger: {ledger.error.message}
          </Alert>
        )}
        {ledger.isSuccess && ledger.data.length === 0 && <EmptyState icon={<BookOpen />} title="No entries in this date range." className="flex-1" />}
        {ledger.data && ledger.data.length > 0 && <LedgerTable rows={ledger.data} className="min-h-0 flex-1" />}
      </Card>
    </div>
  );
}

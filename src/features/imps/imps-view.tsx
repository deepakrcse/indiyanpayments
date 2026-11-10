'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftRight, BadgeCheck, Landmark, Plus, Search, Smartphone, UserPlus } from 'lucide-react';
import { api, ApiClientError, errorMessage } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { MESSAGES, PATTERNS } from '@/lib/validation/patterns';
import { routes } from '@/config/routes';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Alert, EmptyState, LoadingRows } from '@/components/ui/feedback';
import { Field, Input, PrefixInput } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { useBack } from '@/components/layout/navigation-history';
import { useWallet } from '@/features/wallet/use-wallet';
import { rupees } from '@/lib/format';
import type { BankAccount, Sender } from '@/types/imps';
import { AddBankAccountForm } from './add-bank-account-form';
import { BankAccountCard } from './bank-account-card';
import { TodayTransfers } from './today-transfers';
import { TransferPanel } from './transfer-panel';

type Step = 'lookup' | 'register' | 'sender';

/**
 * Pay out › IMPS. Enter the sender's mobile → their record is found (or registered, name only) →
 * pick one of their bank accounts (or add and verify one) → amount and PIN → receipt.
 */
export function ImpsView() {
  const qc = useQueryClient();
  const goBack = useBack();
  const wallet = useWallet();
  const [step, setStep] = useState<Step>('lookup');
  const [mobile, setMobile] = useState('');
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [sender, setSender] = useState<Sender | null>(null);
  const [senderName, setSenderName] = useState('');
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [selected, setSelected] = useState<BankAccount | null>(null);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');

  const accounts = useQuery({
    queryKey: qk.bankAccounts(mobile),
    queryFn: () => api.get<BankAccount[]>('/api/bank-accounts', { mobile }),
    enabled: step === 'sender' && Boolean(sender),
  });

  const lookup = useMutation({
    mutationFn: (m: string) => api.get<Sender>('/api/senders', { mobile: m }),
    onSuccess: (s) => {
      setSender(s);
      setStep('sender');
    },
    onError: (err) => {
      if (err instanceof ApiClientError && err.status === 404) {
        setSenderName('');
        setRegisterError(null);
        setStep('register');
      } else setMobileError(errorMessage(err));
    },
  });

  const register = useMutation({
    mutationFn: () => api.post<Sender>('/api/senders', { mobileNumber: mobile, senderName: senderName.trim() }),
    onSuccess: (s) => {
      setSender(s);
      setStep('sender');
    },
    onError: (err) => setRegisterError(errorMessage(err)),
  });

  const reset = () => {
    setStep('lookup');
    setMobile('');
    setSender(null);
    setSelected(null);
    setAdding(false);
    setSearch('');
    setMobileError(null);
  };

  const onLookup = (e: FormEvent) => {
    e.preventDefault();
    if (!PATTERNS.indianMobile.test(mobile)) return setMobileError(MESSAGES.indianMobile);
    setMobileError(null);
    lookup.mutate(mobile);
  };

  const visibleAccounts = useMemo(() => {
    const list = accounts.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    const digits = q.replace(/\s+/g, '');
    return list.filter((a) => [a.accountHolderName, a.bankName, a.ifsc].some((v) => v.toLowerCase().includes(q)) || a.accountNumber.replace(/\s+/g, '').includes(digits));
  }, [accounts.data, search]);

  // One Back for the whole flow: from any step straight to the mobile entry; from there, out.
  const back = () => (adding ? setAdding(false) : step === 'lookup' ? goBack(routes.home) : reset());

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-var(--chrome-h))]">
      <PageHeader
        eyebrow="Pay out"
        title="IMPS transfer"
        description="Instant bank transfers from your wallet to a verified beneficiary."
        onBack={back}
        actions={
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-card">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Available</span>
            <span className="text-[15px] font-extrabold text-ink-900 tabular">{rupees(wallet.data?.currentBalance)}</span>
          </div>
        }
      />

      {step === 'lookup' && (
        <div className="grid items-start gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
          <Card>
            <CardHeader title="Find the sender" description="Enter the sender's mobile number to verify or register them." icon={<Smartphone />} />
            <CardBody>
              <form onSubmit={onLookup} className="space-y-4">
                <Field label="Sender mobile number" error={mobileError}>
                  {(p) => (
                    <PrefixInput
                      {...p}
                      prefix="+91"
                      inputMode="numeric"
                      autoFocus
                      autoComplete="off"
                      placeholder="98765 43210"
                      className="font-mono text-base tracking-wider"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    />
                  )}
                </Field>
                <Button type="submit" size="lg" block loading={lookup.isPending}>
                  <Search className="size-4" /> Verify sender
                </Button>
              </form>
            </CardBody>
          </Card>
          <TodayTransfers className="lg:max-h-full" />
        </div>
      )}

      {step === 'register' && (
        <Card className="max-w-lg">
          <CardHeader title="Register this sender" description={<>No sender is registered for <strong className="text-ink-900">+91 {mobile}</strong> yet. Their name is all that&apos;s needed.</>} icon={<UserPlus />} />
          <CardBody>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!senderName.trim()) return setRegisterError('Sender name is required.');
                register.mutate();
              }}
              className="space-y-4"
            >
              <Field label="Sender name" error={registerError}>
                {(p) => <Input {...p} autoFocus value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="As on their ID" />}
              </Field>
              <div className="flex gap-2.5">
                <Button variant="outline" onClick={reset}>
                  Cancel
                </Button>
                <Button type="submit" loading={register.isPending}>
                  Register sender
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {step === 'sender' && sender && (
        <>
          <div className="mb-4 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border border-jade-100 bg-jade-50 px-4 py-2.5 text-[13px]">
            <BadgeCheck className="size-4.5 text-jade-600" />
            <span className="font-bold text-ink-900">{sender.senderName}</span>
            <span className="font-mono text-slate-600">+91 {sender.mobileNumber}</span>
            {[sender.senderAddress, sender.senderPan, sender.senderAadhaar].filter(Boolean).map((d) => (
              <span key={d} className="text-slate-500">
                {d}
              </span>
            ))}
            <button type="button" onClick={reset} className="ml-auto rounded-lg px-2 py-1 text-[12.5px] font-bold text-brand-600 transition hover:bg-white hover:text-brand-800">
              Change sender
            </button>
          </div>

          <div className="grid items-start gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)] lg:items-stretch">
            <Card className="flex flex-col overflow-hidden lg:max-h-full">
              <CardHeader
                title="Beneficiary accounts"
                description="Pick the account to pay into."
                icon={<Landmark />}
                actions={
                  !adding && (
                    <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
                      <Plus className="size-4" /> Add account
                    </Button>
                  )
                }
              />
              <CardBody className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-4">
                {adding ? (
                  <AddBankAccountForm
                    mobileNumber={sender.mobileNumber}
                    onCancel={() => setAdding(false)}
                    onSaved={(list) => {
                      qc.setQueryData(qk.bankAccounts(mobile), list);
                      setAdding(false);
                      setSelected(null);
                    }}
                  />
                ) : (
                  <>
                    {(accounts.data?.length ?? 0) > 3 && <SearchInput value={search} onChange={setSearch} placeholder="Search by name or account number" className="mb-3" size="sm" />}
                    {accounts.isPending && <LoadingRows rows={3} />}
                    {accounts.isError && <Alert tone="danger">{accounts.error.message}</Alert>}
                    {accounts.isSuccess && accounts.data.length === 0 && (
                      <EmptyState icon={<Landmark />} title="No bank account yet" action={<Button onClick={() => setAdding(true)}><Plus className="size-4" /> Add the first account</Button>}>
                        Register this sender&apos;s beneficiary account to send money.
                      </EmptyState>
                    )}
                    {accounts.isSuccess && accounts.data.length > 0 && visibleAccounts.length === 0 && <p className="py-6 text-center text-[13px] text-slate-500">No account matches “{search.trim()}”.</p>}
                    <div className="scrollbar-thin max-h-[520px] space-y-2 overflow-y-auto pr-1 lg:max-h-none lg:overflow-visible">
                      {visibleAccounts.map((a) => (
                        <BankAccountCard key={a.id} account={a} selected={selected?.id === a.id} onClick={() => setSelected(a)} />
                      ))}
                    </div>
                  </>
                )}
              </CardBody>
            </Card>

            <Card className="flex flex-col overflow-hidden lg:max-h-full">
              <CardHeader title="Send money" description="IMPS settles in seconds, any time." icon={<ArrowLeftRight />} />
              <CardBody className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-4">
                {selected && !adding ? (
                  <TransferPanel key={selected.id} sender={sender} account={selected} />
                ) : (
                  <EmptyState icon={<ArrowLeftRight />} title="Choose an account" className="py-8 lg:h-full">
                    {(accounts.data?.length ?? 0) > 0 ? 'Click a beneficiary account to transfer to it.' : 'Add a bank account to enable transfers.'}
                  </EmptyState>
                )}
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

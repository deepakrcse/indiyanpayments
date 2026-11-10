'use client';

import { useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, ChevronRight, CreditCard, Lock, ShieldCheck, Smartphone, TriangleAlert } from 'lucide-react';
import { api, errorMessage } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { rupees } from '@/lib/format';
import { routes } from '@/config/routes';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Alert, EmptyState, Skeleton } from '@/components/ui/feedback';
import { Field, Input } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import type { Biller, BillPaymentResult, BillSummary } from '@/types/bbps';
import { BillerAvatar } from './biller-avatar';
import { BillPayPanel } from './bill-pay-panel';
import { cleanValue, fieldError, fieldsFor, HDFC_LIMIT, isHdfc, POPULAR_BILLERS } from './billers';

/**
 * Pay out › Credit card bills. Choose the issuing bank, enter that bank's card details — fetching
 * the bill is the verification — then pay all, the minimum, or another amount from the wallet.
 */
export function CardBillsView() {
  const billers = useQuery({ queryKey: qk.billers, queryFn: () => api.get<Biller[]>('/api/bbps/billers', { category: 'credit-card' }), staleTime: 60 * 60_000 });
  const [query, setQuery] = useState('');
  const [biller, setBiller] = useState<Biller | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [bill, setBill] = useState<BillSummary | null>(null);
  const [paid, setPaid] = useState<(BillPaymentResult & { at: Date }) | null>(null);
  const [hdfcAlert, setHdfcAlert] = useState(false);

  const list = useMemo(() => billers.data ?? [], [billers.data]);
  const popular = useMemo(() => POPULAR_BILLERS.map(({ id, label }) => ({ biller: list.find((b) => b.billerId === id), label })).filter((p): p is { biller: Biller; label: string } => Boolean(p.biller)), [list]);
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? list.filter((b) => b.billerName.toLowerCase().includes(needle)) : list;
  }, [list, query]);

  const fields = useMemo(() => fieldsFor(biller), [biller]);
  const cardDigits = values[fields.find((f) => f.kind === 'card')?.paramName ?? ''] ?? '';

  const fetchBill = useMutation({
    mutationFn: () => api.post<BillSummary>('/api/bbps/bills/fetch', { billerId: biller!.billerId, values }),
    onSuccess: setBill,
  });

  const choose = (next: Biller | null) => {
    setBiller(next);
    setValues({});
    setErrors({});
    setBill(null);
    setPaid(null);
    fetchBill.reset();
    // HDFC takes no payment above ₹49,999 — said once, as soon as that bank is chosen.
    setHdfcAlert(Boolean(next && isHdfc(next)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found = Object.fromEntries(fields.map((f) => [f.paramName, fieldError(f, values[f.paramName] ?? '')]).filter(([, m]) => m));
    setErrors(found);
    if (Object.keys(found).length === 0) fetchBill.mutate();
  };

  const editDetails = () => {
    setBill(null);
    setPaid(null);
    fetchBill.reset();
  };

  return (
    <>
      <PageHeader eyebrow="Pay out" title="Credit card bills" description="Pay any Indian credit card's bill from your wallet, through BBPS." back={routes.home} />

      {!biller && (
        <Card>
          <CardBody className="space-y-6">
            <SearchInput value={query} onChange={setQuery} placeholder="Search by bank name" />

            {!query && popular.length > 0 && (
              <div>
                <p className="mb-3 text-[12px] font-bold tracking-wider text-slate-500 uppercase">Popular banks</p>
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
                  {popular.map(({ biller: b, label }) => (
                    <button key={b.billerId} type="button" onClick={() => choose(b)} title={b.billerName} className="group flex flex-col items-center gap-2 rounded-2xl p-2 transition hover:bg-brand-50">
                      <span className="transition group-hover:scale-105">
                        <BillerAvatar billerId={b.billerId} name={b.billerName} size={56} />
                      </span>
                      <span className="text-[12px] font-semibold text-ink-800">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-3 text-[12px] font-bold tracking-wider text-slate-500 uppercase">{billers.data && query ? `${visible.length} ${visible.length === 1 ? 'bank' : 'banks'} found` : 'All banks'}</p>
              {billers.isPending && (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 9 }, (_, i) => (
                    <Skeleton key={i} className="h-16 rounded-2xl" />
                  ))}
                </div>
              )}
              {billers.isError && <Alert tone="danger">{billers.error.message}</Alert>}
              {billers.isSuccess && visible.length === 0 && <EmptyState icon={<CreditCard />} title={`No bank matches “${query.trim()}”`} />}
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((b) => (
                  <button key={b.billerId} type="button" onClick={() => choose(b)} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-brand-300 hover:shadow-card">
                    <BillerAvatar billerId={b.billerId} name={b.billerName} />
                    <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink-900">{b.billerName}</span>
                    <ChevronRight className="size-4 text-slate-300" />
                  </button>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {biller && (
        <Card>
          <div className="flex flex-wrap items-center gap-3.5 border-b border-slate-100 px-5 py-4">
            <BillerAvatar billerId={biller.billerId} name={biller.billerName} size={48} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold text-ink-900">{biller.billerName}</p>
              <p className="flex items-center gap-1 text-[12.5px] text-slate-500">
                {bill && !bill.noBillDue ? (
                  <>
                    <CheckCircle2 className="size-3.5 text-jade-600" /> Bill fetched
                  </>
                ) : (
                  'Enter the card details to fetch the bill'
                )}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => choose(null)}>
              Change bank
            </Button>
          </div>

          <CardBody>
            {!bill && (
              <form onSubmit={submit} noValidate className="mx-auto max-w-md space-y-4">
                {fields.map((field) => {
                  const value = values[field.paramName] ?? '';
                  const label = field.kind === 'mobile' ? 'Registered mobile number' : field.kind === 'card' ? 'Last 4 digits of card' : field.paramName;
                  return (
                    <Field key={field.paramName} label={label} error={errors[field.paramName]}>
                      {(p) => (
                        <Input
                          {...p}
                          inputMode={field.dataType === 'NUMERIC' ? 'numeric' : 'text'}
                          autoComplete="off"
                          maxLength={field.kind === 'mobile' ? 10 : field.kind === 'card' ? 4 : 64}
                          placeholder={field.kind === 'mobile' ? '10-digit number' : field.kind === 'card' ? 'XXXX' : ''}
                          leading={field.kind === 'mobile' ? <Smartphone className="size-4" /> : field.kind === 'card' ? <CreditCard className="size-4" /> : undefined}
                          className={field.kind === 'card' ? 'font-mono tracking-[0.35em]' : undefined}
                          value={value}
                          onChange={(e) => {
                            setValues((v) => ({ ...v, [field.paramName]: cleanValue(field, e.target.value) }));
                            setErrors((x) => ({ ...x, [field.paramName]: null }));
                            fetchBill.reset();
                          }}
                        />
                      )}
                    </Field>
                  );
                })}
                {fetchBill.isError && <Alert tone="danger">{errorMessage(fetchBill.error)}</Alert>}
                <Button type="submit" size="lg" block loading={fetchBill.isPending}>
                  {fetchBill.isPending ? 'Fetching your bill…' : 'Verify card & fetch bill'}
                </Button>
                <p className="flex items-center justify-center gap-1.5 text-[12px] text-slate-500">
                  <Lock className="size-3.5" /> Your card details are only used to fetch this bill.
                </p>
              </form>
            )}

            {/* The card matched, but this cycle's bill is already paid — good news, not an error. */}
            {bill?.noBillDue && (
              <div className="mx-auto max-w-md py-6 text-center">
                <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-jade-50 text-jade-600">
                  <CheckCircle2 className="size-8" />
                </span>
                <p className="mt-4 text-lg font-extrabold text-ink-900">No bill due</p>
                <p className="mt-1 text-[13.5px] text-slate-500">Card •••• {cardDigits} is verified, and there is nothing to pay for the current billing period.</p>
                {bill.message && <p className="mt-3 text-[12.5px] text-slate-400 italic">The bank says: “{bill.message}”</p>}
                <div className="mt-6 flex justify-center gap-2.5">
                  <Button variant="outline" onClick={editDetails}>
                    Check this card again
                  </Button>
                  <Button onClick={() => choose(null)}>Pay another card</Button>
                </div>
              </div>
            )}

            {bill && !bill.noBillDue && !paid && <BillPayPanel biller={biller} bill={bill} cardDigits={cardDigits} onEdit={editDetails} onPaid={(r) => setPaid({ ...r, at: new Date() })} />}

            {paid && (
              <div className="mx-auto max-w-md py-4 text-center">
                <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-jade-50 text-jade-600">
                  <CheckCircle2 className="size-8" />
                </span>
                <p className="mt-4 text-[13px] font-semibold text-slate-500">Payment successful</p>
                <p className="text-[32px] font-extrabold text-ink-900 tabular">{rupees(paid.amount)}</p>
                <p className="text-[13px] text-slate-500">
                  paid to {biller.billerName} •••• {cardDigits}
                </p>
                <dl className="mt-5 divide-y divide-slate-100 rounded-2xl bg-slate-50 px-4 text-left text-[13px]">
                  {[
                    ['Card holder', bill?.customerName || '—'],
                    ['Paid on', paid.at.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })],
                    ['Reference', <span key="r" className="font-mono text-[12px] break-all">{paid.reference}</span>],
                    ...(paid.message ? [['Status', paid.message]] : []),
                  ].map(([label, value]) => (
                    <div key={String(label)} className="flex justify-between gap-3 py-2.5">
                      <dt className="text-slate-500">{label}</dt>
                      <dd className="text-right font-semibold text-ink-900">{value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-[12px] text-slate-500">The bank may take a short while to show this payment on the card.</p>
                <div className="mt-5 flex justify-center gap-2.5">
                  <Link href={routes.wallet} className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-ink-800 hover:border-brand-300">
                    View wallet ledger
                  </Link>
                  <Button onClick={() => choose(null)}>Pay another card</Button>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      <p className="mt-6 flex items-center justify-center gap-1.5 text-[12.5px] text-slate-500">
        <ShieldCheck className="size-4 text-jade-600" /> Bill payments through Bharat BillPay, secured by Indiyana Payments
      </p>

      <Dialog open={hdfcAlert} onClose={() => setHdfcAlert(false)} size="sm" hideClose>
        <div className="text-center">
          <span className="mx-auto mt-2 grid size-16 place-items-center rounded-2xl bg-gold-50 text-gold-600">
            <TriangleAlert className="size-8" />
          </span>
          <p className="mt-4 text-[11px] font-bold tracking-widest text-slate-400 uppercase">HDFC credit card</p>
          <h2 className="mt-1 text-xl font-extrabold text-ink-900">Payment limit</h2>
          <div className="mt-4 rounded-2xl bg-slate-50 py-3">
            <p className="text-[12px] text-slate-500">Maximum per payment</p>
            <p className="text-2xl font-extrabold text-ink-900 tabular">{rupees(HDFC_LIMIT, 0)}</p>
          </div>
          <p className="mt-4 text-[13.5px] text-slate-600">HDFC will not accept a payment above {rupees(HDFC_LIMIT, 0)}. Please keep each payment at or below this amount.</p>
          <Button block className="mt-5" autoFocus onClick={() => setHdfcAlert(false)}>
            Got it
          </Button>
        </div>
      </Dialog>
    </>
  );
}

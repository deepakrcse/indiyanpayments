'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CreditCard, Layers, Link2, UserRound } from 'lucide-react';
import { api, errorMessage } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { cn } from '@/lib/cn';
import { ServiceMark } from '@/components/brand/service-mark';
import { formatCharge, rupees } from '@/lib/format';
import { sanitizeAmount } from '@/lib/validation/patterns';
import { routes } from '@/config/routes';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, EmptyState, LoadingRows } from '@/components/ui/feedback';
import { Field, Input } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SegmentedTabs } from '@/components/ui/tabs';
import { useSession } from '@/features/auth/session-context';
import type { PaymentLink, WalletGateway } from '@/types/pg';
import { LinkResultDialog } from './link-result-dialog';
import { loadPayers, rememberReference, savePayer, type SavedPayer } from './saved-payers';

const uniqueBy = <T,>(list: T[], key: keyof T) => [...new Map(list.map((r) => [r[key], r])).values()];

/**
 * Collect › Card collection. The gateways mapped to this wallet arrive flat (one row per
 * Group × Settlement × PG) and are grouped here as the person drills in: group, then settlement
 * (by name — the same settlement type has a different id per PG), then the gateway itself.
 */
export function GatewayCheckout() {
  const { user } = useSession();
  const gateways = useQuery({ queryKey: qk.gateways, queryFn: () => api.get<WalletGateway[]>('/api/pg/gateways') });
  const rows = useMemo(() => gateways.data ?? [], [gateways.data]);

  const [groupId, setGroupId] = useState<number | null>(null);
  const [settlementName, setSettlementName] = useState<string | null>(null);
  const [selected, setSelected] = useState<WalletGateway | null>(null);
  const [amount, setAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [card, setCard] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PaymentLink | null>(null);
  const [payers, setPayers] = useState<SavedPayer[]>([]);
  // Read after mount: the list lives in this browser's storage, which the server render can't see.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage
    setPayers(loadPayers(user.walletId));
  }, [user.walletId]);

  const groups = useMemo(() => uniqueBy(rows, 'groupId'), [rows]);
  const activeGroup = groupId ?? groups[0]?.groupId ?? null;
  const groupRows = rows.filter((r) => r.groupId === activeGroup);
  const settlements = uniqueBy(groupRows, 'settlementName');
  const activeSettlement = settlementName && settlements.some((s) => s.settlementName === settlementName) ? settlementName : settlements[0]?.settlementName ?? null;
  const pgs = groupRows.filter((r) => r.settlementName === activeSettlement);

  const maxLimit = selected?.maxLimit ?? null;

  const pick = (pg: WalletGateway) => {
    setSelected(pg);
    setAmount('');
    setCustomerName('');
    setCard('');
    setError(null);
  };

  const generate = useMutation({
    mutationFn: (body: { pgCode: string; customerName: string; cardLast4: string; amount: number }) => api.post<PaymentLink>('/api/pg/links', body),
    onSuccess: (link, body) => {
      setResult(link);
      if (link.refNo) rememberReference(link.refNo);
      setPayers(savePayer(user.walletId, body.customerName, body.cardLast4));
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!selected?.pgKey) return setError('This gateway has no code configured — ask an admin to set its settlement key.');
    const value = Number(amount);
    if (!amount || !Number.isFinite(value) || value <= 0) return setError(maxLimit == null ? 'Enter an amount.' : `Enter an amount up to ${rupees(maxLimit)}.`);
    if (!customerName.trim()) return setError('Enter the customer name.');
    if (!/^\d{4}$/.test(card)) return setError('Enter the last 4 digits of the card.');
    setError(null);
    generate.mutate({ pgCode: selected.pgKey, customerName: customerName.trim(), cardLast4: card, amount: value });
  };

  return (
    <>
      <PageHeader eyebrow="Collect" title="Card collection" description="Pick a gateway, enter the amount and the card's last four digits, and share the secure link." back={routes.home} />

      {gateways.isPending && (
        <Card>
          <LoadingRows rows={4} />
        </Card>
      )}
      {gateways.isError && <Alert tone="danger">Couldn&apos;t load your payment gateways: {gateways.error.message}</Alert>}
      {gateways.isSuccess && rows.length === 0 && (
        <Card>
          <EmptyState icon={<CreditCard />} title="No payment gateways yet">
            No gateways are set up for your wallet. An admin can apply them from PG settings.
          </EmptyState>
        </Card>
      )}

      {rows.length > 0 && (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 p-5">
              <p className="mb-2.5 flex items-center gap-2 text-[12px] font-bold tracking-wider text-slate-500 uppercase">
                <Layers className="size-3.5" /> 1 · Choose a gateway
              </p>
              <div className="flex flex-wrap gap-2">
                {groups.map((g) => (
                  <button
                    key={g.groupId}
                    type="button"
                    onClick={() => {
                      setGroupId(g.groupId);
                      setSettlementName(null);
                      setSelected(null);
                    }}
                    className={cn(
                      'rounded-xl border px-3.5 py-2 text-[13px] font-bold transition',
                      g.groupId === activeGroup ? 'border-ink-900 bg-ink-900 text-white' : 'border-slate-200 bg-white text-ink-800 hover:border-brand-300',
                    )}
                  >
                    {g.groupName}
                  </button>
                ))}
              </div>
              {settlements.length > 0 && (
                <SegmentedTabs
                  className="mt-4"
                  label="Settlement"
                  value={activeSettlement ?? ''}
                  onChange={(v) => {
                    setSettlementName(v);
                    setSelected(null);
                  }}
                  items={settlements.map((s) => ({ value: s.settlementName, label: s.settlementName }))}
                />
              )}
            </div>
            <ul className="divide-y divide-slate-100">
              {pgs.map((pg) => {
                const isSelected = selected?.pgId === pg.pgId && selected.settlementId === pg.settlementId;
                return (
                  <li key={`${pg.pgId}-${pg.settlementId}`}>
                    <button
                      type="button"
                      onClick={() => pick(pg)}
                      className={cn('relative flex w-full flex-wrap items-center gap-4 px-5 py-3.5 text-left transition', isSelected ? 'bg-gradient-to-r from-brand-50 to-white' : 'hover:bg-slate-50')}
                    >
                      {isSelected && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-brand-700" aria-hidden />}
                      <ServiceMark src="/services/card.png" size="sm" className={cn('h-11 w-16 rounded-xl', isSelected && 'ring-brand-300')} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-[14px] font-bold text-ink-900">{pg.pgName}</span>
                        <span className="block text-[12px] text-slate-500">{pg.categoryName}</span>
                      </span>
                      <span className="text-right">
                        <span className="block text-[10.5px] font-bold tracking-wider text-slate-400 uppercase">Max</span>
                        <span className="block text-[13px] font-bold text-ink-900 tabular">{pg.maxLimit == null ? 'No limit' : rupees(pg.maxLimit)}</span>
                      </span>
                      <span className="w-20 text-right">
                        <span className="block text-[10.5px] font-bold tracking-wider text-slate-400 uppercase">Charge</span>
                        <span className="block text-[13px] font-bold text-ink-900 tabular">{formatCharge(pg.chargeType, pg.chargeValue)}</span>
                      </span>
                      <span className={cn('rounded-lg px-3 py-1.5 text-[12px] font-bold', isSelected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600')}>{isSelected ? 'Selected' : 'Select'}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card className="lg:sticky lg:top-24">
            {!selected ? (
              <EmptyState icon={<Link2 />} title="2 · Payment details">
                Choose a gateway on the left to enter the amount and card.
              </EmptyState>
            ) : (
              <form onSubmit={submit} className="space-y-4 p-5">
                <div>
                  <p className="text-[12px] font-bold tracking-wider text-slate-500 uppercase">2 · Payment details</p>
                  <h2 className="mt-1 text-[17px] font-extrabold text-ink-900">{selected.pgName}</h2>
                  <p className="text-[12.5px] text-slate-500">
                    {selected.categoryName} · {selected.settlementName} · Max {maxLimit == null ? 'no limit' : rupees(maxLimit)} · {formatCharge(selected.chargeType, selected.chargeValue)}
                  </p>
                </div>

                <Field label="Amount" hint={maxLimit != null ? `Up to ${rupees(maxLimit)} on this gateway.` : undefined}>
                  {(p) => (
                    <Input
                      {...p}
                      inputMode="decimal"
                      placeholder={maxLimit == null ? 'Enter amount' : `Up to ${rupees(maxLimit)}`}
                      leading={<span className="text-sm font-bold">₹</span>}
                      className="text-base font-bold"
                      value={amount}
                      onChange={(e) => {
                        const v = sanitizeAmount(e.target.value);
                        // A keystroke that would go over the gateway's cap simply doesn't register.
                        if (v !== null && (maxLimit == null || v === '' || Number(v) <= maxLimit)) setAmount(v);
                      }}
                    />
                  )}
                </Field>

                {payers.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[12.5px] font-semibold text-slate-600">Paying with a card used before?</p>
                    <div className="flex flex-wrap gap-1.5">
                      {payers.map((p) => {
                        const active = customerName === p.name && card === p.card;
                        return (
                          <button
                            key={`${p.name}-${p.card}`}
                            type="button"
                            onClick={() => {
                              setCustomerName(p.name);
                              setCard(p.card);
                              setError(null);
                            }}
                            className={cn('rounded-full border px-3 py-1 text-[12px] font-semibold transition', active ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300')}
                          >
                            {p.name} · •••• {p.card}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Field label="Customer name">
                  {(p) => (
                    <Input
                      {...p}
                      placeholder="e.g. Rohan Kumar"
                      leading={<UserRound className="size-4" />}
                      value={customerName}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCustomerName(value);
                        // A name used before brings its card along, if the card box is still empty.
                        const match = payers.find((x) => x.name.toLowerCase() === value.trim().toLowerCase());
                        if (match && card === '') setCard(match.card);
                      }}
                    />
                  )}
                </Field>
                <Field label="Card — last four digits">
                  {(p) => (
                    <Input
                      {...p}
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="1234"
                      leading={<span className="text-xs font-bold tracking-widest">••••</span>}
                      className="font-mono tracking-[0.3em]"
                      value={card}
                      onChange={(e) => setCard(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    />
                  )}
                </Field>

                {error && <Alert tone="danger">{error}</Alert>}
                <Button type="submit" size="lg" block loading={generate.isPending}>
                  <Link2 className="size-4.5" /> Generate payment link
                </Button>
              </form>
            )}
          </Card>
        </div>
      )}

      <LinkResultDialog link={result} onClose={() => setResult(null)} />
    </>
  );
}

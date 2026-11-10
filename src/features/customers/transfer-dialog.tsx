'use client';

import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowRightLeft, CheckCircle2 } from 'lucide-react';
import { api, errorMessage } from '@/lib/api/client';
import { rupees } from '@/lib/format';
import { sanitizeAmount } from '@/lib/validation/patterns';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/feedback';
import { Field, Input } from '@/components/ui/field';
import { useSession } from '@/features/auth/session-context';
import { useMoneyMoved, useWallet } from '@/features/wallet/use-wallet';
import type { CustomerWithWallet } from '@/types/customer';

/** Moves balance from the admin's own wallet to a customer's wallet, then shows the receipt. */
export function TransferDialog({ target, onClose }: { target: CustomerWithWallet | null; onClose: () => void }) {
  const { user } = useSession();
  const wallet = useWallet();
  const moneyMoved = useMoneyMoved();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{ transferId: unknown; amount: number; at: string; to: string } | null>(null);

  const transfer = useMutation({
    mutationFn: (value: number) => api.post<{ transferId: unknown }>('/api/wallet/transfer', { toWalletId: target!.wallet!.walletId, amount: value }),
    onSuccess: (res, value) => {
      setReceipt({ transferId: res.transferId, amount: value, at: new Date().toLocaleString('en-IN'), to: target!.fullName });
      setAmount('');
      moneyMoved();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const close = () => {
    if (transfer.isPending) return;
    setReceipt(null);
    setError(null);
    setAmount('');
    onClose();
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!amount || !Number.isFinite(value) || value <= 0) return setError('Enter a valid amount.');
    if (wallet.data && value > wallet.data.currentBalance) return setError('Insufficient balance.');
    setError(null);
    transfer.mutate(value);
  };

  return (
    <Dialog open={Boolean(target)} onClose={close} dismissible={!transfer.isPending} size="sm" title={receipt ? undefined : `Transfer to ${target?.fullName ?? ''}`} description={receipt ? undefined : `From your wallet · available ${rupees(wallet.data?.currentBalance)}`} icon={receipt ? undefined : <ArrowRightLeft />} hideClose={Boolean(receipt)}>
      {receipt ? (
        <div className="text-center">
          <span className="mx-auto mt-2 grid size-16 place-items-center rounded-2xl bg-jade-50 text-jade-600">
            <CheckCircle2 className="size-8" />
          </span>
          <p className="mt-4 text-[13px] font-semibold text-slate-500">Transfer successful</p>
          <p className="text-[30px] font-extrabold text-ink-900 tabular">{rupees(receipt.amount)}</p>
          <dl className="mt-4 divide-y divide-slate-100 rounded-2xl bg-slate-50 px-4 text-left text-[13px]">
            {[
              ['Transfer ID', String(receipt.transferId ?? '—')],
              ['Date', receipt.at],
              ['From', user.fullName],
              ['To', receipt.to],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 py-2.5">
                <dt className="text-slate-500">{k}</dt>
                <dd className="text-right font-semibold text-ink-900">{v}</dd>
              </div>
            ))}
          </dl>
          <Button block className="mt-5" onClick={close}>
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Amount" error={error}>
            {(p) => (
              <Input
                {...p}
                autoFocus
                inputMode="decimal"
                placeholder="e.g. 500"
                leading={<span className="text-sm font-bold">₹</span>}
                value={amount}
                onChange={(e) => {
                  const v = sanitizeAmount(e.target.value);
                  if (v !== null) setAmount(v);
                }}
              />
            )}
          </Field>
          {transfer.isError && !error && <Alert tone="danger">{errorMessage(transfer.error)}</Alert>}
          <div className="flex gap-2.5">
            <Button variant="outline" block onClick={close}>
              Cancel
            </Button>
            <Button type="submit" block loading={transfer.isPending}>
              Transfer
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

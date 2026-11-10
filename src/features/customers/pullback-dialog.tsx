'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, HandCoins } from 'lucide-react';
import { api, errorMessage } from '@/lib/api/client';
import { rupees } from '@/lib/format';
import { sanitizeAmount } from '@/lib/validation/patterns';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/feedback';
import { Field, Input } from '@/components/ui/field';
import { useMoneyMoved } from '@/features/wallet/use-wallet';
import type { CustomerWithWallet } from '@/types/customer';

/**
 * Admin: pull money back from a retailer's wallet into your own. "Pull back" only asks to confirm;
 * nothing is sent until the confirmation is accepted.
 */
export function PullbackDialog({ target, onClose }: { target: CustomerWithWallet | null; onClose: () => void }) {
  const moneyMoved = useMoneyMoved();
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState<{ amount: number; message: string } | null>(null);

  const balance = target?.wallet?.currentBalance ?? null;
  const value = Number(amount);
  const amountError = amount === '' ? null : !Number.isFinite(value) || value <= 0 ? 'Enter a valid amount.' : balance != null && value > balance ? `This retailer only has ${rupees(balance)}.` : null;
  const canContinue = Boolean(target?.wallet && amount !== '' && !amountError);

  const pull = useMutation({
    mutationFn: () => api.post<{ message: string; amount: number }>('/api/admin/pullbacks', { walletId: target!.wallet!.walletId, amount: value, remarks: remarks.trim() }),
    onSuccess: (res) => {
      setDone({ amount: res.amount ?? value, message: res.message });
      moneyMoved();
    },
    onError: () => setConfirming(false),
  });

  const close = () => {
    if (pull.isPending) return;
    setAmount('');
    setRemarks('');
    setConfirming(false);
    setDone(null);
    pull.reset();
    onClose();
  };

  return (
    <Dialog open={Boolean(target)} onClose={close} dismissible={!pull.isPending} size="sm" title={done ? undefined : 'Pull back from a retailer'} description={done ? undefined : "Moves money out of the retailer's wallet and into yours."} icon={done ? undefined : <HandCoins />} hideClose={Boolean(done)}>
      {done ? (
        <div className="text-center">
          <span className="mx-auto mt-2 grid size-16 place-items-center rounded-2xl bg-jade-50 text-jade-600">
            <CheckCircle2 className="size-8" />
          </span>
          <p className="mt-4 text-lg font-extrabold text-ink-900">Pullback successful</p>
          <p className="mt-1 text-[13.5px] text-slate-500">
            {rupees(done.amount)} was pulled back from {target?.fullName} into your wallet.
          </p>
          <Button block className="mt-5" onClick={close}>
            Done
          </Button>
        </div>
      ) : (
        target && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
              <Avatar name={target.fullName} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-ink-900">{target.fullName}</p>
                <p className="truncate text-[12.5px] text-slate-500">{target.storeName}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-500">Balance</p>
                <p className={balance != null && balance < 0 ? 'font-bold text-rose-600' : 'font-bold text-ink-900'}>{rupees(balance)}</p>
              </div>
            </div>
            <Field label="Amount" error={amountError}>
              {(p) => (
                <Input
                  {...p}
                  autoFocus
                  inputMode="decimal"
                  placeholder="e.g. 5000"
                  leading={<span className="text-sm font-bold">₹</span>}
                  value={amount}
                  onChange={(e) => {
                    const v = sanitizeAmount(e.target.value);
                    if (v !== null) {
                      setAmount(v);
                      setConfirming(false);
                    }
                  }}
                />
              )}
            </Field>
            <Field label="Reason (optional)">{(p) => <Input {...p} maxLength={200} placeholder="Admin pullback" value={remarks} onChange={(e) => setRemarks(e.target.value)} />}</Field>
            {pull.isError && <Alert tone="danger">{errorMessage(pull.error)}</Alert>}
            {confirming && canContinue && (
              <Alert tone="warning">
                {rupees(value)} will be taken from <strong>{target.fullName}</strong> and added to your wallet. This can&apos;t be undone from here.
              </Alert>
            )}
            <div className="flex gap-2.5">
              <Button variant="outline" block onClick={() => (confirming ? setConfirming(false) : close())} disabled={pull.isPending}>
                {confirming ? 'Back' : 'Cancel'}
              </Button>
              <Button variant={confirming ? 'danger' : 'primary'} block disabled={!canContinue} loading={pull.isPending} onClick={() => (confirming ? pull.mutate() : setConfirming(true))}>
                {confirming ? 'Confirm pullback' : 'Pull back'}
              </Button>
            </div>
          </div>
        )
      )}
    </Dialog>
  );
}

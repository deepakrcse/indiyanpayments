'use client';

import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api/client';
import { rupees } from '@/lib/format';
import { sanitizeAmount } from '@/lib/validation/patterns';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field, Input } from '@/components/ui/field';
import { useSession } from '@/features/auth/session-context';
import type { Wallet } from '@/types/wallet';
import { useMoneyMoved } from './use-wallet';

/** Admin top-up of their own wallet. */
export function AddCreditDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useSession();
  const moneyMoved = useMoneyMoved();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const credit = useMutation({
    mutationFn: (value: number) => api.post<Wallet>(`/api/customers/${user.customerId}/wallet/credit`, { amount: value }),
    onSuccess: (wallet, value) => {
      moneyMoved();
      toast.success(`${rupees(value)} added`, { description: `New balance ${rupees(wallet.currentBalance)}` });
      setAmount('');
      onClose();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!amount || !Number.isFinite(value) || value <= 0) return setError('Enter a valid amount.');
    setError(null);
    credit.mutate(value);
  };

  return (
    <Dialog
      open={open}
      onClose={() => !credit.isPending && onClose()}
      dismissible={!credit.isPending}
      title="Add credit"
      description="Tops up your own wallet balance."
      icon={<PlusCircle />}
      size="sm"
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Amount" error={error}>
          {(p) => (
            <Input
              {...p}
              autoFocus
              inputMode="decimal"
              placeholder="e.g. 5,000"
              leading={<span className="text-sm font-bold">₹</span>}
              value={amount}
              onChange={(e) => {
                const v = sanitizeAmount(e.target.value);
                if (v !== null) setAmount(v);
              }}
            />
          )}
        </Field>
        <div className="flex gap-2.5">
          <Button variant="outline" block onClick={onClose} disabled={credit.isPending}>
            Cancel
          </Button>
          <Button type="submit" block loading={credit.isPending}>
            Add credit
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

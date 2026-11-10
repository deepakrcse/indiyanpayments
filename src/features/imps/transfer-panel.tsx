'use client';

import { useState, type FocusEvent, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, Download, Lock, Receipt, Share2 } from 'lucide-react';
import { api, errorMessage } from '@/lib/api/client';
import { dateTime, rupees } from '@/lib/format';
import { MAX_IMPS_AMOUNT } from '@/lib/validation/schemas';
import { PATTERNS, sanitizeAmount } from '@/lib/validation/patterns';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/feedback';
import { Field, Input } from '@/components/ui/field';
import { useSession } from '@/features/auth/session-context';
import { useLetterhead } from '@/features/profile/use-letterhead';
import { useMoneyMoved, useWallet } from '@/features/wallet/use-wallet';
import type { BankAccount, Sender } from '@/types/imps';
import { BankAccountCard } from './bank-account-card';
import { ReceiptDialog } from './receipt-dialog';
import { downloadImpsReceipt, shareImpsReceipt, type ImpsReceipt } from './receipt';

// Browsers fill saved passwords into fields even with autocomplete="off". These start read-only
// (autofill skips read-only fields) and become editable the moment they are focused.
const unlock = (e: FocusEvent<HTMLInputElement>) => e.currentTarget.removeAttribute('readonly');

/** Amount + PIN for one chosen account, and the receipt once it has gone. */
export function TransferPanel({ sender, account }: { sender: Sender; account: BankAccount }) {
  const { user } = useSession();
  const wallet = useWallet();
  const moneyMoved = useMoneyMoved();
  const head = useLetterhead();
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [errors, setErrors] = useState<{ amount?: string; pin?: string; form?: string }>({});
  const [receipt, setReceipt] = useState<ImpsReceipt | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const balance = wallet.data?.currentBalance ?? null;
  const rate = wallet.data?.payoutCharges ?? user.payoutCharges;
  // Informational: the amount times this wallet's payout-charge rate, as they type.
  const charge = Number(amount || 0) * Number(rate || 0);

  const send = useMutation({
    mutationFn: (value: number) => api.post<{ transactionId: number | null }>('/api/transfers', { senderId: sender.id, bankAccountId: account.id, amount: value, pin }),
    onSuccess: (data, value) => {
      setReceipt({
        transactionId: data.transactionId,
        dateTime: dateTime(new Date().toISOString()),
        status: 'SUCCESS',
        utr: null,
        senderName: sender.senderName,
        senderMobile: sender.mobileNumber,
        accountHolderName: account.accountHolderName,
        accountNumber: account.accountNumber,
        ifsc: account.ifsc,
        bankName: account.bankName,
        bankLogoUrl: account.bankLogoUrl,
        amount: value,
      });
      setShowReceipt(true);
      setAmount('');
      setPin('');
      moneyMoved();
    },
    onError: (err) => setErrors({ form: errorMessage(err) }),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    const found: typeof errors = {};
    if (!amount || !Number.isFinite(value) || value <= 0) found.amount = 'Enter a valid amount.';
    else if (value > MAX_IMPS_AMOUNT) found.amount = `Amount cannot exceed ${rupees(MAX_IMPS_AMOUNT, 0)}.`;
    else if (balance !== null && value > balance) found.amount = 'Insufficient balance.';
    if (!PATTERNS.transferPin.test(pin)) found.pin = 'Enter your 4-6 digit PIN.';
    setErrors(found);
    if (Object.keys(found).length === 0) send.mutate(value);
  };

  return (
    <div className="space-y-4">
      <BankAccountCard account={account} selected />
      <form onSubmit={submit} className="space-y-4" noValidate autoComplete="off">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount" error={errors.amount} hint={amount && Number.isFinite(charge) ? `Payout charges ${rupees(charge)}` : `Up to ${rupees(MAX_IMPS_AMOUNT, 0)}`}>
            {(p) => (
              <Input
                {...p}
                name="imps-amount"
                inputMode="decimal"
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore=""
                readOnly
                onFocus={unlock}
                leading={<span className="text-sm font-bold">₹</span>}
                className="text-base font-bold"
                value={amount}
                onChange={(e) => {
                  const v = sanitizeAmount(e.target.value);
                  if (v !== null && (v === '' || Number(v) <= MAX_IMPS_AMOUNT)) setAmount(v);
                }}
              />
            )}
          </Field>
          <Field label="Transaction PIN" error={errors.pin}>
            {(p) => (
              <Input
                {...p}
                name="imps-pin"
                type="password"
                inputMode="numeric"
                maxLength={6}
                autoComplete="new-password"
                data-lpignore="true"
                data-1p-ignore=""
                readOnly
                onFocus={unlock}
                leading={<Lock className="size-4" />}
                className="font-mono tracking-[0.4em]"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            )}
          </Field>
        </div>
        {errors.form && <Alert tone="danger">{errors.form}</Alert>}
        {receipt && !send.isPending && (
          <Alert
            tone="success"
            title="Transfer submitted"
            action={
              <div className="flex gap-1">
                <button type="button" onClick={() => setShowReceipt(true)} className="rounded-lg p-1.5 hover:bg-jade-100" aria-label="View receipt" title="View receipt">
                  <Receipt className="size-4" />
                </button>
                <button type="button" onClick={() => downloadImpsReceipt(receipt, head)} className="rounded-lg p-1.5 hover:bg-jade-100" aria-label="Download receipt" title="Download">
                  <Download className="size-4" />
                </button>
                <button type="button" onClick={() => shareImpsReceipt(receipt, head)} className="rounded-lg p-1.5 hover:bg-jade-100" aria-label="Share receipt" title="Share">
                  <Share2 className="size-4" />
                </button>
              </div>
            }
          >
            {rupees(receipt.amount)} to {receipt.accountHolderName}.
          </Alert>
        )}
        <Button type="submit" size="lg" block loading={send.isPending}>
          <CheckCircle2 className="size-4.5" /> {amount ? `Send ${rupees(Number(amount))}` : 'Send money'}
        </Button>
      </form>
      <ReceiptDialog receipt={showReceipt ? receipt : null} onClose={() => setShowReceipt(false)} />
    </div>
  );
}

'use client';

import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { BadgeCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiClientError, errorMessage } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { MESSAGES, PATTERNS } from '@/lib/validation/patterns';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/feedback';
import { Field, Input } from '@/components/ui/field';
import { useMoneyMoved } from '@/features/wallet/use-wallet';
import type { Bank, BankAccount, BankVerification } from '@/types/imps';
import { BankCombobox } from './bank-combobox';

const EMPTY = { bankName: '', accountNumber: '', ifsc: '', accountHolderName: '' };

/**
 * Register a beneficiary account for this sender. "Verify" runs a penny-drop check (charged to the
 * wallet) and fills in the holder's name as the bank has it.
 */
export function AddBankAccountForm({ mobileNumber, onSaved, onCancel }: { mobileNumber: string; onSaved: (accounts: BankAccount[]) => void; onCancel: () => void }) {
  const banks = useQuery({ queryKey: qk.banks, queryFn: () => api.get<Bank[]>('/api/banks'), staleTime: 60 * 60_000 });
  const moneyMoved = useMoneyMoved();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [verified, setVerified] = useState<string | null>(null);

  const verify = useMutation({
    mutationFn: () => api.post<BankVerification>('/api/bank-accounts/verify', { accountNumber: form.accountNumber, ifsc: form.ifsc }),
    onSuccess: (res) => {
      setForm((f) => ({ ...f, accountHolderName: res.verifiedName }));
      setVerified(res.verifiedName);
      setErrors((e) => ({ ...e, accountHolderName: '', verify: '' }));
      moneyMoved(); // verification is charged to the wallet
    },
    onError: (err) => setErrors((e) => ({ ...e, verify: errorMessage(err) || 'Could not verify this account.' })),
  });

  const save = useMutation({
    mutationFn: () => api.post<BankAccount[]>('/api/bank-accounts', { mobileNumber, ...form }),
    onSuccess: (accounts) => {
      toast.success('Bank account added');
      onSaved(accounts);
    },
    onError: (err) => {
      if (err instanceof ApiClientError && Object.keys(err.fieldErrors).length) setErrors(err.fieldErrors);
      else setErrors({ form: errorMessage(err) });
    },
  });

  const runVerify = () => {
    if (!form.bankName) return setErrors({ verify: 'Select a bank first.' });
    if (!PATTERNS.accountNumber.test(form.accountNumber)) return setErrors({ verify: 'Enter a valid account number first.' });
    if (!PATTERNS.ifsc.test(form.ifsc)) return setErrors({ verify: 'Enter or pick the IFSC code first.' });
    verify.mutate();
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (!form.bankName.trim()) found.bankName = 'Bank name is required.';
    if (!PATTERNS.accountNumber.test(form.accountNumber)) found.accountNumber = MESSAGES.accountNumber;
    if (!PATTERNS.ifsc.test(form.ifsc)) found.ifsc = MESSAGES.ifsc;
    if (!form.accountHolderName.trim()) found.accountHolderName = 'Account holder name is required.';
    setErrors(found);
    if (Object.keys(found).length === 0) save.mutate();
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Bank" error={errors.bankName}>
        {(p) => (
          <BankCombobox
            id={p.id}
            invalid={p['aria-invalid']}
            banks={banks.data ?? []}
            value={form.bankName}
            onSelect={(bank) => {
              setVerified(null);
              // Keep a typed IFSC if the choice is cleared mid-edit.
              setForm((f) => ({ ...f, bankName: bank?.bankName ?? '', ifsc: bank?.ifsc || f.ifsc }));
            }}
          />
        )}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Account number" error={errors.accountNumber}>
          {(p) => (
            <Input
              {...p}
              inputMode="numeric"
              maxLength={18}
              className="font-mono"
              value={form.accountNumber}
              onChange={(e) => {
                setVerified(null);
                setForm((f) => ({ ...f, accountNumber: e.target.value.replace(/\D/g, '') }));
              }}
            />
          )}
        </Field>
        <Field label="IFSC" error={errors.ifsc}>
          {(p) => (
            <Input
              {...p}
              maxLength={11}
              placeholder="ABCD0123456"
              className="font-mono uppercase"
              value={form.ifsc}
              onChange={(e) => {
                setVerified(null);
                setForm((f) => ({ ...f, ifsc: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11) }));
              }}
            />
          )}
        </Field>
      </div>
      <div className="flex items-end gap-2.5">
        <Field label="Account holder name" error={errors.accountHolderName} className="flex-1">
          {(p) => <Input {...p} value={form.accountHolderName} onChange={(e) => setForm((f) => ({ ...f, accountHolderName: e.target.value }))} />}
        </Field>
        <Button variant={verified ? 'success' : 'secondary'} className="h-11" onClick={runVerify} loading={verify.isPending}>
          <BadgeCheck className="size-4" /> {verified ? 'Verified' : 'Verify'}
        </Button>
      </div>
      {verified && <Alert tone="success">The bank has this account as <strong>{verified}</strong>.</Alert>}
      {errors.verify && <Alert tone="danger">{errors.verify}</Alert>}
      {errors.form && <Alert tone="danger">{errors.form}</Alert>}
      <p className="text-[12px] text-slate-500">Verification is a small penny-drop check charged to your wallet.</p>
      <div className="flex gap-2.5">
        <Button variant="outline" onClick={onCancel} disabled={save.isPending}>
          Cancel
        </Button>
        <Button type="submit" loading={save.isPending}>
          Save bank account
        </Button>
      </div>
    </form>
  );
}

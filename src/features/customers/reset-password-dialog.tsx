'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, KeyRound } from 'lucide-react';
import { api, errorMessage } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/feedback';
import { Field, Input, SecretInput } from '@/components/ui/field';

/**
 * Admin: set a new wallet password and/or PIN for a customer, without the old ones. Leave a box
 * empty to keep it. Pressing Reset only asks to confirm.
 */
export function ResetPasswordDialog({ customer, onClose }: { customer: { id: number; fullName: string } | null; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState('');

  const reset = useMutation({
    mutationFn: () => api.post<{ message: string }>(`/api/customers/${customer!.id}/wallet/reset-password`, { newPassword: password || null, newPin: pin || null }),
    onSuccess: (res) => setDone(res.message || 'Reset.'),
    onError: (err) => {
      setError(errorMessage(err));
      setConfirming(false);
    },
  });

  const problem = () => {
    if (!password && !pin) return 'Enter a new password, a new PIN, or both.';
    if (password && password.length < 6) return 'The password must be at least 6 characters.';
    if (password && password !== confirm) return 'The two passwords do not match.';
    if (pin && !/^\d{4}$/.test(pin)) return 'The PIN must be exactly 4 digits.';
    return '';
  };

  const close = () => {
    if (reset.isPending) return;
    setPassword('');
    setConfirm('');
    setPin('');
    setError('');
    setConfirming(false);
    setDone('');
    onClose();
  };

  const what = password && pin ? 'password and PIN' : password ? 'password' : 'PIN';

  return (
    <Dialog open={Boolean(customer)} onClose={close} dismissible={!reset.isPending} size="sm" title={done ? undefined : 'Reset password'} description={done ? undefined : <>For <strong className="text-ink-900">{customer?.fullName}</strong>. Fill in only what you want to change.</>} icon={done ? undefined : <KeyRound />} hideClose={Boolean(done)}>
      {done ? (
        <div className="text-center">
          <span className="mx-auto mt-2 grid size-16 place-items-center rounded-2xl bg-jade-50 text-jade-600">
            <CheckCircle2 className="size-8" />
          </span>
          <p className="mt-4 text-lg font-extrabold text-ink-900">{done}</p>
          <p className="mt-1 text-[13.5px] text-slate-500">{customer?.fullName} can sign in with the new details now.</p>
          <Button block className="mt-5" onClick={close}>
            Done
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Field label="New password">
            {(p) => (
              <SecretInput
                {...p}
                autoComplete="new-password"
                placeholder="Leave empty to keep"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setConfirming(false);
                }}
              />
            )}
          </Field>
          {password && (
            <Field label="Confirm new password">
              {(p) => (
                <SecretInput
                  {...p}
                  autoComplete="new-password"
                  placeholder="Type it again"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    setConfirming(false);
                  }}
                />
              )}
            </Field>
          )}
          <Field label="New 4-digit PIN">
            {(p) => (
              <Input
                {...p}
                inputMode="numeric"
                maxLength={4}
                autoComplete="off"
                placeholder="Leave empty to keep"
                className="font-mono tracking-[0.4em]"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                  setConfirming(false);
                }}
              />
            )}
          </Field>
          {error && <Alert tone="danger">{error}</Alert>}
          {confirming && (
            <Alert tone="warning">
              This changes {customer?.fullName}&apos;s {what} straight away. The old {password && pin ? 'ones stop' : 'one stops'} working.
            </Alert>
          )}
          <div className="flex gap-2.5">
            <Button variant="outline" block onClick={() => (confirming ? setConfirming(false) : close())} disabled={reset.isPending}>
              {confirming ? 'Back' : 'Cancel'}
            </Button>
            <Button
              variant={confirming ? 'danger' : 'primary'}
              block
              loading={reset.isPending}
              onClick={() => {
                if (confirming) return reset.mutate();
                const issue = problem();
                setError(issue);
                if (!issue) setConfirming(true);
              }}
            >
              {confirming ? 'Confirm reset' : 'Reset'}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

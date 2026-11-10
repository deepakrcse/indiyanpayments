'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ChevronRight, KeyRound, Mail, Phone, ShieldCheck, Store, UserRound, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api/client';
import { rupees } from '@/lib/format';
import { routes } from '@/config/routes';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/feedback';
import { Field, SecretInput } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { useSession } from '@/features/auth/session-context';
import { useWallet } from '@/features/wallet/use-wallet';
import { useProfile } from './use-letterhead';

function Row({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-t border-slate-100 py-3 first:border-t-0">
      <Icon className="mt-0.5 size-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-[11.5px] font-bold tracking-wider text-slate-400 uppercase">{label}</p>
        <p className="mt-0.5 text-[14px] font-semibold break-words text-ink-900">{value || '—'}</p>
      </div>
    </div>
  );
}

const pinOnly = (v: string) => v.replace(/\D/g, '').slice(0, 4);

/**
 * Profile: who is signed in, plus changing the password and the transaction PIN. The remote
 * changes both together, so each form sends the value it is not changing as both old and new.
 */
export function ProfileView() {
  const { user } = useSession();
  const profile = useProfile();
  const wallet = useWallet();
  const [open, setOpen] = useState<'password' | 'pin' | null>(null);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '', pin: '' });
  const [pn, setPn] = useState({ password: '', current: '', next: '', confirm: '' });
  const [error, setError] = useState<string | null>(null);

  const change = useMutation({
    mutationFn: (body: { oldPassword: string; oldPasspin: string; newPassword: string; newPasspin: string }) => api.post<{ message: string }>('/api/me/credentials', body),
    onSuccess: (res) => {
      toast.success(res.message || 'Updated');
      setPw({ current: '', next: '', confirm: '', pin: '' });
      setPn({ password: '', current: '', next: '', confirm: '' });
      setOpen(null);
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const show = (which: 'password' | 'pin') => {
    setPw({ current: '', next: '', confirm: '', pin: '' });
    setPn({ password: '', current: '', next: '', confirm: '' });
    setError(null);
    setOpen(which);
  };
  const close = () => !change.isPending && setOpen(null);

  const changePassword = (e: FormEvent) => {
    e.preventDefault();
    if (!pw.current) return setError('Enter your current password.');
    if (pw.next.length < 6) return setError('The new password must be at least 6 characters.');
    if (pw.next !== pw.confirm) return setError('The new passwords do not match.');
    if (!/^\d{4}$/.test(pw.pin)) return setError('Enter your current 4-digit PIN to confirm.');
    setError(null);
    change.mutate({ oldPassword: pw.current, oldPasspin: pw.pin, newPassword: pw.next, newPasspin: pw.pin });
  };

  const changePin = (e: FormEvent) => {
    e.preventDefault();
    if (!pn.password) return setError('Enter your current password.');
    if (!/^\d{4}$/.test(pn.current)) return setError('Enter your current 4-digit PIN.');
    if (!/^\d{4}$/.test(pn.next)) return setError('The new PIN must be 4 digits.');
    if (pn.next !== pn.confirm) return setError('The new PINs do not match.');
    setError(null);
    change.mutate({ oldPassword: pn.password, oldPasspin: pn.current, newPassword: pn.password, newPasspin: pn.next });
  };

  const p = profile.data;

  return (
    <>
      <PageHeader eyebrow="Account" title="Profile & security" back={routes.home} />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card>
          <div className="bg-aurora flex items-center gap-4 rounded-t-2xl p-5 text-white">
            <Avatar name={p?.fullName ?? user.fullName} size={56} className="ring-2 ring-white/30" />
            <div className="min-w-0">
              <p className="truncate text-lg font-extrabold">{p?.fullName ?? user.fullName}</p>
              <Badge tone="dark" className="mt-1 bg-white/15 ring-white/20">
                {user.roleName || user.role}
              </Badge>
            </div>
          </div>
          <CardBody className="pt-2">
            <Row icon={UserRound} label="Login ID" value={user.username} />
            <Row icon={Phone} label="Mobile" value={(p?.mobileNumber ?? user.mobileNumber) && `+91 ${p?.mobileNumber ?? user.mobileNumber}`} />
            <Row icon={Mail} label="Email" value={p?.email ?? user.email} />
            <Row icon={Store} label="Store" value={[p?.storeName ?? user.storeName, p?.storeAddress].filter(Boolean).join(' — ')} />
            <Row icon={Wallet} label="Wallet balance" value={wallet.data ? rupees(wallet.data.currentBalance) : ''} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Security" description="Your password signs you in; your 4-digit PIN confirms every payout." icon={<ShieldCheck />} />
          <div className="divide-y divide-slate-100">
            {(
              [
                ['password', 'Password', 'Used to sign in. Change it if you think someone else knows it.', KeyRound],
                ['pin', 'Transaction PIN', 'Four digits that approve IMPS transfers and card-bill payments.', ShieldCheck],
              ] as const
            ).map(([key, title, hint, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => show(key)}
                className="group flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition hover:bg-brand-50/40"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition group-hover:bg-brand-700 group-hover:text-white">
                  <Icon className="size-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[14px] font-bold text-ink-900">{title}</span>
                  <span className="block text-[12.5px] text-slate-500">{hint}</span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] font-bold text-ink-800 transition group-hover:border-brand-300 group-hover:text-brand-700">
                  Change <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Dialog
          open={open === 'password'}
          onClose={close}
          dismissible={!change.isPending}
          title="Change password"
          description="You'll use the new password the next time you sign in."
          icon={<KeyRound />}
          size="sm"
        >
          <form onSubmit={changePassword} className="space-y-4" noValidate>
            <Field label="Current password">{(f) => <SecretInput {...f} autoFocus autoComplete="current-password" value={pw.current} onChange={(e) => setPw((s) => ({ ...s, current: e.target.value }))} />}</Field>
            <Field label="New password" hint="At least 6 characters.">{(f) => <SecretInput {...f} autoComplete="new-password" value={pw.next} onChange={(e) => setPw((s) => ({ ...s, next: e.target.value }))} />}</Field>
            <Field label="Confirm new password">{(f) => <SecretInput {...f} autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw((s) => ({ ...s, confirm: e.target.value }))} />}</Field>
            <Field label="Current PIN" hint="To confirm it's you.">{(f) => <SecretInput {...f} inputMode="numeric" maxLength={4} value={pw.pin} onChange={(e) => setPw((s) => ({ ...s, pin: pinOnly(e.target.value) }))} />}</Field>
            {error && <Alert tone="danger">{error}</Alert>}
            <div className="flex gap-2.5 pt-1">
              <Button variant="outline" block onClick={close} disabled={change.isPending}>
                Cancel
              </Button>
              <Button type="submit" block loading={change.isPending}>
                Update password
              </Button>
            </div>
          </form>
        </Dialog>

        <Dialog
          open={open === 'pin'}
          onClose={close}
          dismissible={!change.isPending}
          title="Change PIN"
          description="Your new PIN approves every payout from now on."
          icon={<ShieldCheck />}
          size="sm"
        >
          <form onSubmit={changePin} className="space-y-4" noValidate>
            <Field label="Current password" hint="To confirm it's you.">{(f) => <SecretInput {...f} autoFocus autoComplete="current-password" value={pn.password} onChange={(e) => setPn((s) => ({ ...s, password: e.target.value }))} />}</Field>
            <Field label="Current PIN">{(f) => <SecretInput {...f} inputMode="numeric" maxLength={4} value={pn.current} onChange={(e) => setPn((s) => ({ ...s, current: pinOnly(e.target.value) }))} />}</Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="New PIN">{(f) => <SecretInput {...f} inputMode="numeric" maxLength={4} value={pn.next} onChange={(e) => setPn((s) => ({ ...s, next: pinOnly(e.target.value) }))} />}</Field>
              <Field label="Confirm PIN">{(f) => <SecretInput {...f} inputMode="numeric" maxLength={4} value={pn.confirm} onChange={(e) => setPn((s) => ({ ...s, confirm: pinOnly(e.target.value) }))} />}</Field>
            </div>
            {error && <Alert tone="danger">{error}</Alert>}
            <div className="flex gap-2.5 pt-1">
              <Button variant="outline" block onClick={close} disabled={change.isPending}>
                Cancel
              </Button>
              <Button type="submit" block loading={change.isPending}>
                Update PIN
              </Button>
            </div>
          </form>
        </Dialog>
      </div>
    </>
  );
}

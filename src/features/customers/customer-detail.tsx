'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IdCard, KeyRound, MapPin, Network, Pencil, Phone, Trash2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { calendarDate, rupees } from '@/lib/format';
import { routes } from '@/config/routes';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Alert, LoadingRows } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/page-header';
import type { ClientInfo } from '@/types/customer';
import { fetchCustomerWallet, roleOf, useCustomer } from './api';
import { ResetPasswordDialog } from './reset-password-dialog';

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-[11.5px] font-bold tracking-wider text-slate-400 uppercase">{label}</dt>
      <dd className="mt-1 text-[14px] font-semibold break-words text-ink-900">{value || '—'}</dd>
    </div>
  );
}

export function CustomerDetail({ id }: { id: number }) {
  const router = useRouter();
  const qc = useQueryClient();
  const customer = useCustomer(id);
  const client = useQuery({ queryKey: qk.client, queryFn: () => api.get<ClientInfo>('/api/client'), staleTime: 60 * 60_000 });
  const wallet = useQuery({ queryKey: qk.customerWallet(id), queryFn: () => fetchCustomerWallet(id), enabled: Boolean(customer.data?.hasWallet) });
  const [deleting, setDeleting] = useState(false);
  const [resetting, setResetting] = useState(false);

  const remove = useMutation({
    mutationFn: () => api.del(`/api/customers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.customers });
      toast.success('Customer deleted');
      router.push(routes.customers);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (customer.isPending) return <Card><LoadingRows rows={6} /></Card>;
  if (customer.isError) return <Alert tone="danger">Couldn&apos;t load the customer: {customer.error.message}</Alert>;
  const c = customer.data;
  const role = roleOf(c);
  const clientLabel = client.data ? `${client.data.clientName}${client.data.firmName ? ` — ${client.data.firmName}` : client.data.clientCity ? ` — ${client.data.clientCity}` : ''}` : `Client #${c.clientId}`;

  return (
    <>
      <PageHeader
        eyebrow={`Customer #${c.id}`}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <Avatar name={c.fullName} size={44} />
            {c.fullName}
            {c.roleName && <Badge tone={role === 'admin' ? 'dark' : 'brand'}>{c.roleName}</Badge>}
          </span>
        }
        description={clientLabel}
        back={routes.customers}
        actions={
          <>
            {role === 'distributor' && c.hasWallet && (
              <Link href={routes.mapping(c.id)} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-50 px-3.5 text-[13px] font-semibold text-brand-700 hover:bg-brand-100">
                <Network className="size-4" /> Mapping
              </Link>
            )}
            {c.hasWallet && (
              <Button variant="outline" size="sm" onClick={() => setResetting(true)}>
                <KeyRound className="size-4" /> Reset password
              </Button>
            )}
            <Link href={routes.editCustomer(c.id)} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 text-[13px] font-semibold text-white hover:bg-brand-700">
              <Pencil className="size-4" /> Edit
            </Link>
            <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => setDeleting(true)}>
              <Trash2 className="size-4" /> Delete
            </Button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader title="Identity" icon={<IdCard />} />
          <dl className="grid gap-4 p-5">
            <Detail label="PAN" value={<span className="font-mono">{c.pan}</span>} />
            <Detail label="Aadhaar" value={<span className="font-mono">{c.aadhaar}</span>} />
            <Detail label="Date of birth" value={calendarDate(c.dateOfBirth)} />
          </dl>
        </Card>
        <Card>
          <CardHeader title="Contact" icon={<Phone />} />
          <dl className="grid gap-4 p-5">
            <Detail label="Mobile" value={`+91 ${c.mobileNumber}`} />
            <Detail label="Email" value={c.email} />
            <Detail label="Login ID" value={c.username} />
          </dl>
        </Card>
        <Card>
          <CardHeader title="Wallet" icon={<Wallet />} />
          <dl className="grid gap-4 p-5">
            {c.hasWallet ? (
              <>
                <Detail label="Balance" value={wallet.data ? <span className="text-lg">{rupees(wallet.data.currentBalance)}</span> : '…'} />
                <Detail label="Payout charge" value={wallet.data ? Number(wallet.data.payoutCharges).toFixed(4) : '…'} />
                <Detail label="Wallet ID" value={wallet.data?.walletId} />
              </>
            ) : (
              <p className="text-[13px] text-slate-500">No wallet yet — add one from the Customers list.</p>
            )}
          </dl>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader title="Store & address" icon={<MapPin />} />
          <dl className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <Detail label="Store name" value={c.storeName} />
            <Detail label="Store address" value={c.storeAddress} />
            <Detail label="Residential address" value={c.residentialAddress} />
            <Detail label="GST" value={c.gst && <span className="font-mono">{c.gst}</span>} />
          </dl>
        </Card>
      </div>

      <ResetPasswordDialog customer={resetting ? { id: c.id, fullName: c.fullName } : null} onClose={() => setResetting(false)} />
      <ConfirmDialog open={deleting} onClose={() => !remove.isPending && setDeleting(false)} onConfirm={() => remove.mutate()} busy={remove.isPending} title="Delete customer" confirmLabel="Delete">
        Are you sure you want to delete <strong className="text-ink-900">{c.fullName}</strong>? This permanently removes the record and can&apos;t be undone.
      </ConfirmDialog>
    </>
  );
}

'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Network, Percent, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { api, errorMessage } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { sanitizeAmount } from '@/lib/validation/patterns';
import { routes } from '@/config/routes';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Alert, EmptyState, LoadingRows } from '@/components/ui/feedback';
import { Field, Input } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SearchSelect } from '@/components/ui/search-select';
import { useCustomer, useRetailers } from '@/features/customers/api';
import type { MappedRetailer } from '@/types/customer';
import { MappedRetailersTable, MappingStats } from './mapped-retailers';

/** Admin › a distributor's mapping: their retailers and commission, and mapping another one. */
export function MappingView({ distributorId }: { distributorId: number }) {
  const sp = useSearchParams();
  const distributor = useCustomer(distributorId);
  const mapped = useQuery({ queryKey: qk.mapping(distributorId), queryFn: () => api.get<MappedRetailer[]>(`/api/customers/${distributorId}/distributor-retailers`) });
  const retailers = useRetailers();
  const [walletId, setWalletId] = useState('');
  const [commission, setCommission] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Retailers not mapped to this distributor yet.
  const options = useMemo(() => {
    const taken = new Set((mapped.data ?? []).map((r) => r.retailerWalletId));
    return (retailers.data ?? []).filter((r) => r.roleName.toLowerCase() === 'retailer' && !taken.has(r.walletId)).map((r) => ({ value: String(r.walletId), label: r.fullName, hint: r.storeName }));
  }, [retailers.data, mapped.data]);

  const map = useMutation({
    mutationFn: (body: { retailerWalletId: number; pgCommissionPercent: number }) => api.post<{ message: string }>(`/api/customers/${distributorId}/distributor-retailers`, body),
    onSuccess: (res) => {
      toast.success(res.message || 'Retailer mapped');
      setWalletId('');
      setCommission('');
      mapped.refetch();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const percent = Number(commission);
    if (!walletId) return setError('Choose a retailer.');
    if (commission === '' || !Number.isFinite(percent) || percent < 0 || percent > 100) return setError('Enter a commission between 0 and 100.');
    setError(null);
    map.mutate({ retailerWalletId: Number(walletId), pgCommissionPercent: percent });
  };

  const d = distributor.data;

  return (
    <>
      <PageHeader
        eyebrow="Distributor"
        title={
          <span className="flex flex-wrap items-center gap-3">
            <Avatar name={d?.fullName ?? '…'} size={44} />
            {d?.fullName ?? 'Loading…'}
            <Badge tone="brand">
              <Network className="size-3" /> Distributor
            </Badge>
          </span>
        }
        description={d ? `+91 ${d.mobileNumber}${d.storeName ? ` · ${d.storeName}` : ''}` : undefined}
        back={sp.get('from') === 'admin' ? routes.admin : routes.customers}
      />
      <MappingStats rows={mapped.data} loading={mapped.isPending} />

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="overflow-hidden">
          <CardHeader title="Mapped retailers" description="And the card-collection commission the distributor earns on each." icon={<Users />} />
          {mapped.isPending && <LoadingRows rows={4} />}
          {mapped.isError && <Alert tone="danger" className="m-5">Couldn&apos;t load the mapping: {mapped.error.message}</Alert>}
          {mapped.isSuccess && mapped.data.length === 0 && (
            <EmptyState icon={<Users />} title="No retailers mapped yet">
              Use “Map a retailer” to add the first one.
            </EmptyState>
          )}
          {mapped.data && mapped.data.length > 0 && <MappedRetailersTable rows={mapped.data} />}
        </Card>

        <Card className="lg:sticky lg:top-24">
          <CardHeader title="Map a retailer" icon={<Plus />} />
          <CardBody>
            <form onSubmit={submit} className="space-y-4">
              <Field label="Retailer">
                {(p) => <SearchSelect id={p.id} options={options} value={walletId} onChange={setWalletId} loading={retailers.isPending} placeholder="Type a name or store" emptyText="No retailer left to map." />}
              </Field>
              <Field label="Card commission (%)" hint="Up to 4 decimals, e.g. 0.20">
                {(p) => (
                  <Input
                    {...p}
                    inputMode="decimal"
                    placeholder="0.20"
                    trailing={<Percent className="mr-2 size-4 text-slate-400" />}
                    value={commission}
                    onChange={(e) => {
                      const v = sanitizeAmount(e.target.value, 4);
                      if (v !== null) setCommission(v);
                    }}
                  />
                )}
              </Field>
              {error && <Alert tone="danger">{error}</Alert>}
              <Button type="submit" block loading={map.isPending}>
                Map retailer
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

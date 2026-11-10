'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { api } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';
import { routes } from '@/config/routes';
import { Card, CardHeader } from '@/components/ui/card';
import { Alert, EmptyState, LoadingRows } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import type { MappedRetailer } from '@/types/customer';
import { MappedRetailersTable, MappingStats } from './mapped-retailers';

/** A distributor's own, read-only view of the retailers mapped to them. Mapping is done by an admin. */
export function MyRetailersView() {
  const mapped = useQuery({ queryKey: qk.myRetailers, queryFn: () => api.get<MappedRetailer[]>('/api/me/retailers') });
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const visible = useMemo(() => (mapped.data ?? []).filter((r) => !needle || [r.fullName, r.storeName, r.mobileNumber].some((v) => v.toLowerCase().includes(needle))), [mapped.data, needle]);

  return (
    <>
      <PageHeader eyebrow="Network" title="My retailers" description="The retailers mapped to you, and the card-collection commission you earn on each." back={routes.home} />
      <MappingStats rows={mapped.data} loading={mapped.isPending} />
      <Card className="mt-5 overflow-hidden">
        <CardHeader
          title="Retailers"
          icon={<Users />}
          actions={(mapped.data?.length ?? 0) > 0 && <SearchInput value={query} onChange={setQuery} placeholder="Search name, store or mobile" size="sm" className="w-72" />}
        />
        {mapped.isPending && <LoadingRows rows={4} />}
        {mapped.isError && <Alert tone="danger" className="m-5">Couldn&apos;t load your retailers: {mapped.error.message}</Alert>}
        {mapped.isSuccess && mapped.data.length === 0 && (
          <EmptyState icon={<Users />} title="No retailers mapped to you yet">
            When an admin maps a retailer to you, they will show up here.
          </EmptyState>
        )}
        {mapped.isSuccess && mapped.data.length > 0 && visible.length === 0 && <EmptyState title={`No retailer matches “${query.trim()}”`} />}
        {visible.length > 0 && <MappedRetailersTable rows={visible} />}
      </Card>
    </>
  );
}

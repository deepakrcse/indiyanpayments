'use client';

import { routes } from '@/config/routes';
import { Card } from '@/components/ui/card';
import { Alert, LoadingRows } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/page-header';
import { useCustomer } from './api';
import { CustomerForm } from './customer-form';

export function EditCustomer({ id }: { id: number }) {
  const customer = useCustomer(id);
  return (
    <>
      <PageHeader eyebrow={`Customer #${id}`} title="Edit customer" back={routes.customer(id)} />
      {customer.isPending && (
        <Card className="max-w-4xl">
          <LoadingRows rows={6} />
        </Card>
      )}
      {customer.isError && <Alert tone="danger">Couldn&apos;t load the customer: {customer.error.message}</Alert>}
      {customer.data && <CustomerForm key={customer.data.id} customer={customer.data} />}
    </>
  );
}

import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { CustomerForm } from '@/features/customers/customer-form';
import { routes } from '@/config/routes';

export const metadata: Metadata = { title: 'New customer' };

export default function NewCustomerPage() {
  return (
    <>
      <PageHeader eyebrow="Customers" title="New customer" description="Every customer created here belongs to this portal's client." back={routes.customers} />
      <CustomerForm />
    </>
  );
}

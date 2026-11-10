import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EditCustomer } from '@/features/customers/edit-customer';

export const metadata: Metadata = { title: 'Edit customer' };

export default async function EditCustomerPage({ params }: { params: Promise<{ customerId: string }> }) {
  const id = Number((await params).customerId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <EditCustomer id={id} />;
}

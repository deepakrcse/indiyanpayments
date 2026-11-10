import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CustomerDetail } from '@/features/customers/customer-detail';

export const metadata: Metadata = { title: 'Customer' };

export default async function CustomerPage({ params }: { params: Promise<{ customerId: string }> }) {
  const id = Number((await params).customerId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <CustomerDetail id={id} />;
}

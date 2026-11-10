import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MappingView } from '@/features/distributors/mapping-view';

export const metadata: Metadata = { title: 'Distributor mapping' };

export default async function MappingPage({ params }: { params: Promise<{ customerId: string }> }) {
  const id = Number((await params).customerId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <MappingView distributorId={id} />;
}

import type { Metadata } from 'next';
import { FeatureOff } from '@/components/layout/feature-off';
import { features } from '@/config/features';
import { CardBillsView } from '@/features/card-bills/card-bills-view';

export const metadata: Metadata = { title: 'Credit card bills' };

export default function CardBillsPage() {
  return features.payOutDisabled ? <FeatureOff name="Card bill payments" /> : <CardBillsView />;
}

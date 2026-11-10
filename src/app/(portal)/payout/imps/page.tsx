import type { Metadata } from 'next';
import { FeatureOff } from '@/components/layout/feature-off';
import { features } from '@/config/features';
import { ImpsView } from '@/features/imps/imps-view';

export const metadata: Metadata = { title: 'IMPS transfer' };

export default function ImpsPage() {
  return features.payOutDisabled ? <FeatureOff name="IMPS" /> : <ImpsView />;
}

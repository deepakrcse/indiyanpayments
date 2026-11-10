import type { Metadata } from 'next';
import { GatewayCheckout } from '@/features/payment-gateway/gateway-checkout';

export const metadata: Metadata = { title: 'Card collection' };

export default function GatewayPage() {
  return <GatewayCheckout />;
}

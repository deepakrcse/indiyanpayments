import type { Metadata } from 'next';
import { WalletView } from '@/features/wallet/wallet-view';

export const metadata: Metadata = { title: 'Wallet & settlement' };

export default function WalletPage() {
  return <WalletView />;
}

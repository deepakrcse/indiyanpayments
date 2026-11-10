import type { Metadata } from 'next';
import { QrCodesView } from '@/features/qr/qr-codes-view';

export const metadata: Metadata = { title: 'QR codes' };

export default function QrCodesPage() {
  return <QrCodesView />;
}

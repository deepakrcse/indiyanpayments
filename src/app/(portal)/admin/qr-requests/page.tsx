import type { Metadata } from 'next';
import { QrRequestsView } from '@/features/qr/qr-requests-view';

export const metadata: Metadata = { title: 'QR requests' };

export default function QrRequestsPage() {
  return <QrRequestsView />;
}

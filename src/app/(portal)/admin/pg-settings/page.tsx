import type { Metadata } from 'next';
import { PgSettingsView } from '@/features/pg-settings/pg-settings-view';

export const metadata: Metadata = { title: 'PG settings' };

export default function PgSettingsPage() {
  return <PgSettingsView />;
}

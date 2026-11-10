import type { Metadata } from 'next';
import { AnnouncementsManager } from '@/features/announcements/announcements-manager';

export const metadata: Metadata = { title: 'Announcements' };

export default function AnnouncementsPage() {
  return <AnnouncementsManager />;
}

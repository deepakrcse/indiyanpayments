import 'server-only';
import { masterClientId } from '@/server/config/env';
import { badGateway, unprocessable } from '@/server/http/errors';
import { rowsOf } from '@/server/http/fields';
import { remotePost } from '@/server/http/remote-api';
import { toAnnouncement } from '@/server/mappers/admin.mapper';
import type { Announcement, AnnouncementInput } from '@/types/admin';

/**
 * Announcement/Select ignores its isActive filter and can repeat rows, so everything is read once,
 * de-duplicated by id and sorted newest first here.
 */
async function selectAll(): Promise<Announcement[]> {
  const result = await remotePost('Announcement/Select', { client_ID: masterClientId() });
  if (!result.ok) throw badGateway(result.message, 'Could not load announcements.');
  const byId = new Map<number, Announcement>();
  for (const a of rowsOf(result.data).map(toAnnouncement)) if (!byId.has(a.id)) byId.set(a.id, a);
  return [...byId.values()].sort((a, b) => String(b.createdTime ?? '').localeCompare(String(a.createdTime ?? '')));
}

export const activeAnnouncements = async () => (await selectAll()).filter((a) => a.isActive);
export const allAnnouncements = selectAll;

export async function createAnnouncement(input: AnnouncementInput) {
  const result = await remotePost('Announcement/Insert', { client_ID: masterClientId(), ...input });
  if (!result.ok) throw unprocessable(result.message, 'The announcement could not be saved.');
  return { message: result.message || 'Announcement published.' };
}

export async function updateAnnouncement(id: number, input: AnnouncementInput) {
  const result = await remotePost('Announcement/Update', { id, client_ID: masterClientId(), ...input });
  if (!result.ok) throw unprocessable(result.message, 'The announcement could not be updated.');
  return { message: result.message || 'Announcement updated.' };
}

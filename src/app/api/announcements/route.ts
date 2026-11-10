import { adminRoute, query, readBody, userRoute } from '@/server/http/route';
import { forbidden } from '@/server/http/errors';
import { activeAnnouncements, allAnnouncements, createAnnouncement } from '@/server/services/announcement.service';
import { announcementSchema } from '@/lib/validation/schemas';

/** Active announcements for everyone; `?scope=all` (admins) includes the switched-off ones. */
export const GET = userRoute(async ({ req, user }) => {
  if (query(req).str('scope') === 'all') {
    if (user.role !== 'admin') throw forbidden('This is only available to admins.');
    return allAnnouncements();
  }
  return activeAnnouncements();
});

export const POST = adminRoute(async ({ req }) => createAnnouncement(await readBody(req, announcementSchema)));

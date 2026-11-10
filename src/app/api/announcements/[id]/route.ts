import { adminRoute, positiveId, readBody } from '@/server/http/route';
import { updateAnnouncement } from '@/server/services/announcement.service';
import { announcementSchema } from '@/lib/validation/schemas';

/** The remote has no delete: switching an announcement off is how it is withdrawn. */
export const PUT = adminRoute(async ({ req, params }) =>
  updateAnnouncement(positiveId(params.id, 'announcement'), await readBody(req, announcementSchema)),
);

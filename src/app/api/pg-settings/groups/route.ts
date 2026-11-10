import { adminRoute, readBody } from '@/server/http/route';
import { createGroup, listGroups } from '@/server/services/pg-settings.service';
import { pgGroupSchema } from '@/lib/validation/schemas';

export const GET = adminRoute(async () => listGroups());

export const POST = adminRoute(async ({ req }) => {
  await createGroup(await readBody(req, pgGroupSchema));
  return listGroups();
});

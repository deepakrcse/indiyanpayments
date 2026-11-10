import { adminRoute, positiveId, readBody } from '@/server/http/route';
import { deleteGroup, listGroups, updateGroup } from '@/server/services/pg-settings.service';
import { pgGroupSchema } from '@/lib/validation/schemas';

export const PUT = adminRoute(async ({ req, params }) => {
  await updateGroup(positiveId(params.id, 'group'), await readBody(req, pgGroupSchema));
  return listGroups();
});

export const DELETE = adminRoute(async ({ params }) => {
  await deleteGroup(positiveId(params.id, 'group'));
});

import { adminRoute, positiveId, readBody } from '@/server/http/route';
import { deleteSettlement, listGateways, updateSettlement } from '@/server/services/pg-settings.service';
import { pgSettlementSchema } from '@/lib/validation/schemas';

export const PUT = adminRoute(async ({ req, params }) => {
  await updateSettlement(positiveId(params.id, 'settlement'), await readBody(req, pgSettlementSchema));
  return listGateways();
});

export const DELETE = adminRoute(async ({ params }) => {
  await deleteSettlement(positiveId(params.id, 'settlement'));
});

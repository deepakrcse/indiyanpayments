import { adminRoute, positiveId, readBody } from '@/server/http/route';
import { deleteGateway, listGateways, updateGateway } from '@/server/services/pg-settings.service';
import { paymentGatewaySchema } from '@/lib/validation/schemas';

export const PUT = adminRoute(async ({ req, params }) => {
  await updateGateway(positiveId(params.id, 'payment gateway'), await readBody(req, paymentGatewaySchema));
  return listGateways();
});

export const DELETE = adminRoute(async ({ params }) => {
  await deleteGateway(positiveId(params.id, 'payment gateway'));
});

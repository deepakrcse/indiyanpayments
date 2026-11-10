import { adminRoute, readBody } from '@/server/http/route';
import { createGateway, listGateways } from '@/server/services/pg-settings.service';
import { paymentGatewaySchema } from '@/lib/validation/schemas';

/** Every payment gateway, each with its settlements nested inside. */
export const GET = adminRoute(async () => listGateways());

export const POST = adminRoute(async ({ req }) => {
  await createGateway(await readBody(req, paymentGatewaySchema));
  return listGateways();
});

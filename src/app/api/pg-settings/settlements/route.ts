import { adminRoute, readBody } from '@/server/http/route';
import { badRequest } from '@/server/http/errors';
import { createSettlement, listGateways } from '@/server/services/pg-settings.service';
import { pgSettlementSchema } from '@/lib/validation/schemas';

/** Settlements arrive nested in each gateway, so a write answers the refreshed gateway list. */
export const POST = adminRoute(async ({ req }) => {
  const input = await readBody(req, pgSettlementSchema);
  if (!input.pgId) throw badRequest('Choose the payment gateway this settlement belongs to.');
  await createSettlement(input);
  return listGateways();
});

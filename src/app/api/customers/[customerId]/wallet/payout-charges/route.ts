import { adminRoute, positiveId, readBody } from '@/server/http/route';
import { updatePayoutCharges } from '@/server/services/wallet.service';
import { payoutChargesSchema } from '@/lib/validation/schemas';

export const PUT = adminRoute(async ({ req, params }) => {
  const { payoutCharges } = await readBody(req, payoutChargesSchema);
  return updatePayoutCharges(positiveId(params.customerId, 'customer'), payoutCharges);
});

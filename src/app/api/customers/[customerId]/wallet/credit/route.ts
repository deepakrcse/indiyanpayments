import { adminRoute, positiveId, readBody } from '@/server/http/route';
import { addCredit } from '@/server/services/wallet.service';
import { amountSchema } from '@/lib/validation/schemas';

/** Admin top-up of a wallet ("Manual topup"). */
export const POST = adminRoute(async ({ req, params }) => {
  const { amount } = await readBody(req, amountSchema);
  return addCredit(positiveId(params.customerId, 'customer'), amount);
});

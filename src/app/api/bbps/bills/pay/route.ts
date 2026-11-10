import { ownWallet, readBody, userRoute } from '@/server/http/route';
import { payBill } from '@/server/services/bbps.service';
import { payBillSchema } from '@/lib/validation/schemas';

/** Pays a fetched bill from the signed-in user's wallet. */
export const POST = userRoute(async ({ req, user }) => {
  const { reference, amount } = await readBody(req, payBillSchema);
  return payBill(ownWallet(user), reference, amount);
});

import { adminRoute, ownWallet, readBody } from '@/server/http/route';
import { pullback } from '@/server/services/admin.service';
import { pullbackSchema } from '@/lib/validation/schemas';

/** Pulls money back from a retailer's wallet into the signed-in admin's own wallet. */
export const POST = adminRoute(async ({ req, user }) => {
  const { walletId, amount, remarks } = await readBody(req, pullbackSchema);
  return pullback(ownWallet(user), walletId, amount, remarks);
});

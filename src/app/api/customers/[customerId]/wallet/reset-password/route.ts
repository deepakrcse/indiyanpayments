import { adminRoute, positiveId, readBody } from '@/server/http/route';
import { resetCredentials } from '@/server/services/wallet.service';
import { resetPasswordSchema } from '@/lib/validation/schemas';

/** Admin: new wallet password and/or PIN without the old ones. */
export const POST = adminRoute(async ({ req, params }) => {
  const { newPassword, newPin } = await readBody(req, resetPasswordSchema);
  return resetCredentials(positiveId(params.customerId, 'customer'), newPassword || null, newPin || null);
});

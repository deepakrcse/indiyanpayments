import { ownWallet, readBody, userRoute } from '@/server/http/route';
import { verifyBankAccount } from '@/server/services/imps.service';
import { verifyAccountSchema } from '@/lib/validation/schemas';

/** Penny-drop verification, charged to the signed-in user's own wallet. */
export const POST = userRoute(async ({ req, user }) => {
  const { accountNumber, ifsc } = await readBody(req, verifyAccountSchema);
  return verifyBankAccount(ownWallet(user), accountNumber, ifsc);
});

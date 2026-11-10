import { adminRoute, readBody } from '@/server/http/route';
import { transferFromWallet } from '@/server/services/wallet.service';
import { walletTransferSchema } from '@/lib/validation/schemas';

/** Moves balance from the signed-in admin's own wallet to another wallet. */
export const POST = adminRoute(async ({ req, user }) => {
  const { toWalletId, amount } = await readBody(req, walletTransferSchema);
  return transferFromWallet(user.customerId, toWalletId, amount);
});

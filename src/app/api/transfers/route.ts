import { query, readBody, reportWallet, userRoute } from '@/server/http/route';
import { sendImps, transferReport } from '@/server/services/imps.service';
import { impsTransferSchema } from '@/lib/validation/schemas';

/** IMPS transfer report over a date range. Admins may name a wallet; everyone else gets their own. */
export const GET = userRoute(async ({ req, user }) => {
  const q = query(req);
  return transferReport(reportWallet(user, q.int('walletId'), user.walletId), q.date('fromDate'), q.date('toDate'));
});

/** Sends an IMPS transfer out of the signed-in user's wallet. */
export const POST = userRoute(async ({ req, user }) => sendImps(user.customerId, await readBody(req, impsTransferSchema)));

import { query, reportWallet, userRoute } from '@/server/http/route';
import { walletLedger } from '@/server/services/imps.service';

/** Every debit and credit on a wallet over a date range. */
export const GET = userRoute(async ({ req, user }) => {
  const q = query(req);
  return walletLedger(reportWallet(user, q.int('walletId'), user.walletId), q.date('fromDate'), q.date('toDate'));
});

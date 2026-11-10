import { query, reportWallet, userRoute } from '@/server/http/route';
import { cardBillReport } from '@/server/services/bbps.service';

/** Card-bill payments over a date range; admins default to every wallet. */
export const GET = userRoute(async ({ req, user }) => {
  const q = query(req);
  return cardBillReport(reportWallet(user, q.int('walletId'), 0), q.date('fromDate'), q.date('toDate'), q.str('status'));
});

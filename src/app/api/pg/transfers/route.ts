import { query, reportWallet, userRoute } from '@/server/http/route';
import { pgTransferReport } from '@/server/services/pg.service';

/**
 * Payment links generated over a date range. An admin's own wallet has no PG activity, so admins
 * default to 0 (every wallet pooled); retailers always get their own. Margins are admin-only.
 */
export const GET = userRoute(async ({ req, user }) => {
  const q = query(req);
  const isAdmin = user.role === 'admin';
  return pgTransferReport(reportWallet(user, q.int('walletId'), 0), q.date('fromDate'), q.date('toDate'), isAdmin);
});

import { publicRoute, query } from '@/server/http/route';
import { paymentStatus } from '@/server/services/pg.service';

/**
 * Public: the result of one payment, by the token from the gateway's redirect or by reference.
 * Only the outcome, amount, UTR and card digits are ever returned.
 */
export const GET = publicRoute(async ({ req, user }) => {
  const q = query(req);
  return paymentStatus({ referenceId: q.str('referenceId'), token: q.str('token') }, user);
});

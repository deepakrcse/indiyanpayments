import { ownWallet, query, readBody, reportWallet, userRoute } from '@/server/http/route';
import { forbidden } from '@/server/http/errors';
import { allQrRequests, createCollectRequest, walletQrRequests } from '@/server/services/qr.service';
import { qrCollectSchema } from '@/lib/validation/schemas';

/**
 * QR collect requests. `scope=all` is the admin's client-wide view; otherwise a wallet's own —
 * admins default to 0 (every wallet), everyone else always gets their own.
 */
export const GET = userRoute(async ({ req, user }) => {
  const q = query(req);
  if (q.str('scope') === 'all') {
    if (user.role !== 'admin') throw forbidden('This is only available to admins.');
    return allQrRequests();
  }
  return walletQrRequests(reportWallet(user, q.int('walletId'), 0));
});

/** Creates a collect request against a pulled QR, filed against the signed-in user's wallet. */
export const POST = userRoute(async ({ req, user }) => createCollectRequest(ownWallet(user), await readBody(req, qrCollectSchema)));

import type { NextRequest } from 'next/server';
import { ownWallet, readBody, userRoute } from '@/server/http/route';
import { generatePaymentLink } from '@/server/services/pg.service';
import { paymentLinkSchema } from '@/lib/validation/schemas';

/** This request's public origin, honouring a reverse proxy in front of the app. */
function originOf(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') ?? req.nextUrl.protocol.replace(':', '');
  return host ? `${proto}://${host}` : req.nextUrl.origin;
}

/** Generates a payment link against the signed-in user's own wallet. */
export const POST = userRoute(async ({ req, user }) =>
  generatePaymentLink(ownWallet(user), await readBody(req, paymentLinkSchema), originOf(req)),
);

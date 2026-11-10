import { query, readBody, userRoute } from '@/server/http/route';
import { badRequest, notFound } from '@/server/http/errors';
import { findSender, registerSender } from '@/server/services/imps.service';
import { senderSchema } from '@/lib/validation/schemas';
import { MESSAGES, PATTERNS } from '@/lib/validation/patterns';

/** Looks an IMPS sender up by mobile number; 404 means "not registered yet". */
export const GET = userRoute(async ({ req }) => {
  const mobile = query(req).str('mobile') ?? '';
  if (!PATTERNS.indianMobile.test(mobile)) throw badRequest(MESSAGES.indianMobile);
  const sender = await findSender(mobile);
  if (!sender) throw notFound('No sender is registered for this number yet.');
  return sender;
});

export const POST = userRoute(async ({ req }) => registerSender(await readBody(req, senderSchema)));

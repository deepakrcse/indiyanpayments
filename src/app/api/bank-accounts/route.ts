import { query, readBody, userRoute } from '@/server/http/route';
import { badRequest } from '@/server/http/errors';
import { accountsForMobile, addBankAccount } from '@/server/services/imps.service';
import { bankAccountSchema } from '@/lib/validation/schemas';
import { MESSAGES, PATTERNS } from '@/lib/validation/patterns';

/** Every bank account registered for a sender's mobile number. */
export const GET = userRoute(async ({ req }) => {
  const mobile = query(req).str('mobile') ?? '';
  if (!PATTERNS.indianMobile.test(mobile)) throw badRequest(MESSAGES.indianMobile);
  return accountsForMobile(mobile);
});

/** Registers an account; answers the sender's full, updated account list. */
export const POST = userRoute(async ({ req }) => addBankAccount(await readBody(req, bankAccountSchema)));

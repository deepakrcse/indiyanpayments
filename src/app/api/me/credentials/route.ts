import { readBody, userRoute } from '@/server/http/route';
import { changeCredentials } from '@/server/services/wallet.service';
import { changeCredentialsSchema } from '@/lib/validation/schemas';

/** Changes the signed-in user's wallet password and PIN (the remote checks the old pair). */
export const POST = userRoute(async ({ req, user }) => changeCredentials(user.customerId, await readBody(req, changeCredentialsSchema)));

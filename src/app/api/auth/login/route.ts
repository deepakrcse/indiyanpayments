import { publicRoute, readBody } from '@/server/http/route';
import { setSession } from '@/server/auth/session';
import { login } from '@/server/services/auth.service';
import { loginSchema } from '@/lib/validation/schemas';

/** Signs in against the remote wallet login and starts a session that lasts until midnight. */
export const POST = publicRoute(async ({ req }) => {
  const { username, password } = await readBody(req, loginSchema);
  const user = await login(username, password);
  await setSession(user);
  return { user };
});

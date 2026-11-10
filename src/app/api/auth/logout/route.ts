import { publicRoute } from '@/server/http/route';
import { clearSession } from '@/server/auth/session';

export const POST = publicRoute(async () => {
  await clearSession();
  return { message: 'Signed out.' };
});

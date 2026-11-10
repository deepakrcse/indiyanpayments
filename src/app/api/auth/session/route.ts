import { publicRoute } from '@/server/http/route';

/** Who is signed in, or `{ user: null }`. Used to notice a session that ended at midnight. */
export const GET = publicRoute(async ({ user }) => ({ user }));

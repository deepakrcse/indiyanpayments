import { ownWallet, userRoute } from '@/server/http/route';
import { todaysTransfers } from '@/server/services/imps.service';

/** Today's IMPS transfers from the signed-in user's wallet. */
export const GET = userRoute(async ({ user }) => todaysTransfers(ownWallet(user)));

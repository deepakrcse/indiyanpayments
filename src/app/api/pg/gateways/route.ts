import { ownWallet, userRoute } from '@/server/http/route';
import { gatewaysForWallet } from '@/server/services/pg.service';

/** The payment gateways mapped to the signed-in user's wallet. */
export const GET = userRoute(async ({ user }) => gatewaysForWallet(ownWallet(user)));

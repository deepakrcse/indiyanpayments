import { userRoute } from '@/server/http/route';
import { getWallet } from '@/server/services/wallet.service';

/** The signed-in user's live wallet (balance, payout charges). */
export const GET = userRoute(async ({ user }) => getWallet(user.customerId));

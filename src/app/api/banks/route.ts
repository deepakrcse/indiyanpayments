import { userRoute } from '@/server/http/route';
import { listBanks } from '@/server/services/imps.service';

/** Bank master list for the bank picker. */
export const GET = userRoute(async () => listBanks());

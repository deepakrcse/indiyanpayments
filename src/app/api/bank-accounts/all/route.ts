import { adminRoute } from '@/server/http/route';
import { allBankAccounts } from '@/server/services/imps.service';

/** Every account on the client (settlement accounts on the wallet page). */
export const GET = adminRoute(async () => allBankAccounts());

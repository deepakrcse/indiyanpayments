import { adminRoute } from '@/server/http/route';
import { listRetailers } from '@/server/services/wallet-owners.service';

/** Everyone with a wallet except distributors — for the retailer pickers. */
export const GET = adminRoute(async () => listRetailers());

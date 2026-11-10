import { ownWallet, readBody, userRoute } from '@/server/http/route';
import { fetchBill } from '@/server/services/bbps.service';
import { fetchBillSchema } from '@/lib/validation/schemas';

/** Fetches a card's bill — which also verifies the card details. */
export const POST = userRoute(async ({ req, user }) => fetchBill(ownWallet(user), await readBody(req, fetchBillSchema)));

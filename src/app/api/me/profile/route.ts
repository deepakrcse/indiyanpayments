import { userRoute } from '@/server/http/route';
import { getOwnedCustomer } from '@/server/services/customer.service';

/** The signed-in user's full customer record (store address, etc.). */
export const GET = userRoute(async ({ user }) => getOwnedCustomer(user.customerId));

import { userRoute } from '@/server/http/route';
import { forbidden } from '@/server/http/errors';
import { mappedRetailers } from '@/server/services/distributor.service';

/** A distributor's own view of the retailers mapped to them. */
export const GET = userRoute(async ({ user }) => {
  if (user.role !== 'distributor') throw forbidden('This is only available to distributors.');
  return mappedRetailers(user.customerId);
});

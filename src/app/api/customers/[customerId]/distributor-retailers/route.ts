import { adminRoute, positiveId, readBody } from '@/server/http/route';
import { mapRetailer, mappedRetailers } from '@/server/services/distributor.service';
import { mappingSchema } from '@/lib/validation/schemas';

export const GET = adminRoute(async ({ params }) => mappedRetailers(positiveId(params.customerId, 'customer')));

/** Maps a retailer to this distributor with the PG commission the distributor earns on it. */
export const POST = adminRoute(async ({ req, params }) => {
  const { retailerWalletId, pgCommissionPercent } = await readBody(req, mappingSchema);
  return mapRetailer(positiveId(params.customerId, 'customer'), retailerWalletId, pgCommissionPercent);
});

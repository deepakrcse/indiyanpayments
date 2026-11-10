import { adminRoute } from '@/server/http/route';
import { syncToAllRetailers } from '@/server/services/pg-settings.service';

/** Pushes the current PG setup out to every retailer wallet. */
export const POST = adminRoute(async () => syncToAllRetailers());

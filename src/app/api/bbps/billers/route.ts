import { query, userRoute } from '@/server/http/route';
import { listBillers } from '@/server/services/bbps.service';

/** Every biller in a category (credit card issuers). */
export const GET = userRoute(async ({ req }) => listBillers(query(req).str('category') ?? 'credit-card'));

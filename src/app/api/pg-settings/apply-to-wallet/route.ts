import { z } from 'zod';
import { adminRoute, readBody } from '@/server/http/route';
import { applyToWallet } from '@/server/services/pg-settings.service';

const schema = z.object({ walletId: z.number().int().positive('Choose a retailer.') });

/** Pushes the current PG setup to one retailer's wallet. */
export const POST = adminRoute(async ({ req }) => applyToWallet((await readBody(req, schema)).walletId));

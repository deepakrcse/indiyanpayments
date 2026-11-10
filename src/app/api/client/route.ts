import { adminRoute } from '@/server/http/route';
import { notFound } from '@/server/http/errors';
import { getMasterClient } from '@/server/services/customer.service';

/** The one client this portal serves. */
export const GET = adminRoute(async () => {
  const client = await getMasterClient();
  if (!client) throw notFound('The client is not set up on the payments service.');
  return client;
});

import { adminRoute, query, readBody } from '@/server/http/route';
import { createCustomer, listCustomers, listCustomersWithWallets } from '@/server/services/customer.service';
import { customerSchema } from '@/lib/validation/schemas';

/** Every customer of the client; `?include=wallets` adds each one's live wallet. */
export const GET = adminRoute(async ({ req }) => (query(req).str('include') === 'wallets' ? listCustomersWithWallets() : listCustomers()));

export const POST = adminRoute(async ({ req }) => {
  const created = await createCustomer(await readBody(req, customerSchema));
  return Response.json(created, { status: 201 });
});

import { adminRoute, positiveId, readBody } from '@/server/http/route';
import { deleteCustomer, getOwnedCustomer, updateCustomer } from '@/server/services/customer.service';
import { customerSchema } from '@/lib/validation/schemas';

export const GET = adminRoute(async ({ params }) => getOwnedCustomer(positiveId(params.customerId, 'customer')));

export const PUT = adminRoute(async ({ req, params }) =>
  updateCustomer(positiveId(params.customerId, 'customer'), await readBody(req, customerSchema)),
);

export const DELETE = adminRoute(async ({ params }) => {
  await deleteCustomer(positiveId(params.customerId, 'customer'));
});

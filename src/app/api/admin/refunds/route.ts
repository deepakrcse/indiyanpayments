import { adminRoute, readBody } from '@/server/http/route';
import { refundTransaction } from '@/server/services/admin.service';
import { refundSchema } from '@/lib/validation/schemas';

export const POST = adminRoute(async ({ req }) => {
  const { id, remarks } = await readBody(req, refundSchema);
  return refundTransaction(id, remarks);
});

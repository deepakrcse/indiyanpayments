import { adminRoute, query } from '@/server/http/route';
import { customerBusiness } from '@/server/services/admin.service';

export const GET = adminRoute(async ({ req }) => {
  const q = query(req);
  return customerBusiness(q.date('fromDate'), q.date('toDate'));
});

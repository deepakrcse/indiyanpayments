import { adminRoute, query } from '@/server/http/route';
import { adminImpsReport } from '@/server/services/admin.service';

export const GET = adminRoute(async ({ req }) => {
  const q = query(req);
  return adminImpsReport(q.date('fromDate'), q.date('toDate'));
});

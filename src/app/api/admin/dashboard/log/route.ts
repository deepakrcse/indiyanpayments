import { adminRoute, query } from '@/server/http/route';
import { dashboardLog } from '@/server/services/dashboard.service';

export const GET = adminRoute(async ({ req }) => {
  const q = query(req);
  return dashboardLog(q.date('fromDate'), q.date('toDate'));
});

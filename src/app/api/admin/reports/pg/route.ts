import { adminRoute, query } from '@/server/http/route';
import { adminPgReport } from '@/server/services/pg.service';

export const GET = adminRoute(async ({ req }) => {
  const q = query(req);
  return adminPgReport(q.date('fromDate'), q.date('toDate'));
});

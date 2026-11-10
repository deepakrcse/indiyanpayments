import { adminRoute } from '@/server/http/route';
import { dashboardSummary } from '@/server/services/dashboard.service';

export const GET = adminRoute(async () => dashboardSummary());

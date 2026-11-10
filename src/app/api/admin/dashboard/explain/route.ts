import { adminRoute } from '@/server/http/route';
import { dashboardExplain } from '@/server/services/dashboard.service';

export const GET = adminRoute(async () => dashboardExplain());

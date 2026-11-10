import { adminRoute } from '@/server/http/route';
import { listRoles } from '@/server/services/customer.service';

export const GET = adminRoute(async () => listRoles());

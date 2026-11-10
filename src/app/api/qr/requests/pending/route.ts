import { adminRoute } from '@/server/http/route';
import { pendingQrRequests } from '@/server/services/qr.service';

export const GET = adminRoute(async () => pendingQrRequests());

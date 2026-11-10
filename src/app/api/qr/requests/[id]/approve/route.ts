import { adminRoute, positiveId } from '@/server/http/route';
import { approveQrRequest } from '@/server/services/qr.service';

export const POST = adminRoute(async ({ params }) => approveQrRequest(positiveId(params.id, 'request')));

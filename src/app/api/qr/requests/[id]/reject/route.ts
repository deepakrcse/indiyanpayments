import { adminRoute, positiveId, readBody } from '@/server/http/route';
import { rejectQrRequest } from '@/server/services/qr.service';
import { qrRejectSchema } from '@/lib/validation/schemas';

export const POST = adminRoute(async ({ req, params }) =>
  rejectQrRequest(positiveId(params.id, 'request'), (await readBody(req, qrRejectSchema)).remarks),
);

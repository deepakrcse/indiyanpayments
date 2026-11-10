import { adminRoute, readBody } from '@/server/http/route';
import { createQrCode, listQrCodes } from '@/server/services/qr.service';
import { qrCodeSchema } from '@/lib/validation/schemas';

export const GET = adminRoute(async () => listQrCodes());

export const POST = adminRoute(async ({ req }) => createQrCode(await readBody(req, qrCodeSchema)));

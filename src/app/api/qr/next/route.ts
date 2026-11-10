import { userRoute } from '@/server/http/route';
import { nextStaticQr } from '@/server/services/qr.service';

/** Pulls the next available static QR from the pool. */
export const POST = userRoute(async () => nextStaticQr());

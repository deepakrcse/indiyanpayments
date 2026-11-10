import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/server/auth/session';

/**
 * Optimistic routing gate. The real checks live in the route handlers and the portal layout;
 * this only decides where a page request should land:
 *  - signed out → /login (remembering where they were going);
 *  - a payer returning from the gateway (/wallet?t=…) on a device where nobody is signed in →
 *    the public payment-status page, which can show them their result;
 *  - signed in and on /login → home;
 *  - not an admin and on /admin or a client-wide report → home / reports;
 *  - not a distributor and on /my-retailers → home.
 */
export async function proxy(req: NextRequest) {
  const { pathname, search, searchParams } = req.nextUrl;
  const user = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === '/login') {
    return user ? NextResponse.redirect(new URL('/', req.url)) : NextResponse.next();
  }

  if (!user) {
    const token = searchParams.get('t');
    if (pathname === '/wallet' && token) {
      return NextResponse.redirect(new URL(`/payment-status?t=${encodeURIComponent(token)}`, req.url));
    }
    const login = new URL('/login', req.url);
    if (pathname !== '/') login.searchParams.set('next', `${pathname}${search}`);
    const res = NextResponse.redirect(login);
    // A cookie that no longer verifies (expired at midnight, or tampered) is cleared.
    if (req.cookies.has(SESSION_COOKIE)) res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  if (pathname.startsWith('/admin') && user.role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url));
  }
  if (ADMIN_REPORTS.test(pathname) && user.role !== 'admin') {
    return NextResponse.redirect(new URL('/reports', req.url));
  }
  if (pathname === '/my-retailers' && user.role !== 'distributor') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

/** Client-wide reports; the page and the API refuse them to non-admins as well. */
const ADMIN_REPORTS = /^\/reports\/(admin-[a-z-]+|customer-business)\/?$/;

export const config = {
  // Everything except the API, the public status page, Next internals and static files.
  matcher: ['/((?!api|payment-status|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|brand/|.*\\.(?:svg|png|jpg|jpeg|webp|ico|txt)$).*)'],
};

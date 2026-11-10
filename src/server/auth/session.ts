import 'server-only';
import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
import { env } from '@/server/config/env';
import { nextMidnight } from '@/server/time';
import type { Role, SessionUser } from '@/types/auth';

export const SESSION_COOKIE = 'ip_session';
const ISSUER = 'indiyan-payments';

const secretKey = () => new TextEncoder().encode(env().SESSION_SECRET);

export function roleFromName(roleName: string | null | undefined): Role {
  const name = (roleName ?? '').trim().toLowerCase();
  if (name === 'admin') return 'admin';
  if (name === 'retailer') return 'retailer';
  if (/^distributors?$/.test(name)) return 'distributor';
  return 'other';
}

/** Signs the session and returns the cookie to set. Expires at the coming midnight. */
export async function createSessionCookie(user: SessionUser) {
  const expires = nextMidnight();
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISSUER)
    .setSubject(String(user.customerId))
    .setIssuedAt()
    .setExpirationTime(Math.floor(expires.getTime() / 1000))
    .sign(secretKey());

  return {
    name: SESSION_COOKIE,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      expires,
    },
  };
}

export async function verifySessionToken(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: ISSUER, algorithms: ['HS256'] });
    const user = (payload as { user?: SessionUser }).user;
    return user && typeof user.customerId === 'number' ? user : null;
  } catch {
    return null;
  }
}

/** The signed-in user for this request, or null. Usable in server components and route handlers. */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export async function setSession(user: SessionUser): Promise<void> {
  const cookie = await createSessionCookie(user);
  (await cookies()).set(cookie.name, cookie.value, cookie.options);
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

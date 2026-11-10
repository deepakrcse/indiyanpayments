import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { ZodError, type ZodType } from 'zod';
import { getSession } from '@/server/auth/session';
import type { SessionUser } from '@/types/auth';
import { ApiError, badRequest, forbidden, unauthorized } from './errors';

type Params = Record<string, string>;
type RouteCtx = { params: Promise<Params> };

interface Context<U> {
  req: NextRequest;
  user: U;
  params: Params;
}

type Handler<U> = (ctx: Context<U>) => Promise<unknown>;

function fieldErrorsOf(err: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join('.') || '_';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function toResponse(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json({ message: err.message, ...(err.fieldErrors ? { fieldErrors: err.fieldErrors } : {}) }, { status: err.status });
  }
  if (err instanceof ZodError) {
    const fieldErrors = fieldErrorsOf(err);
    return NextResponse.json({ message: Object.values(fieldErrors)[0] ?? 'Please check the highlighted fields.', fieldErrors }, { status: 400 });
  }
  console.error('[api] unhandled error', err);
  return NextResponse.json({ message: 'Something went wrong on our side. Please try again.' }, { status: 500 });
}

function wrap<U>(resolveUser: () => Promise<U>, fn: Handler<U>) {
  return async (req: NextRequest, ctx: RouteCtx): Promise<Response> => {
    try {
      const user = await resolveUser();
      const params = (await ctx?.params) ?? {};
      const result = await fn({ req, user, params });
      if (result instanceof Response) return result;
      if (result === undefined) return new NextResponse(null, { status: 204 });
      return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
    } catch (err) {
      return toResponse(err);
    }
  };
}

/** Reachable without signing in (login, the payer's status page). */
export const publicRoute = (fn: Handler<SessionUser | null>) => wrap(getSession, fn);

/** Any signed-in user. */
export const userRoute = (fn: Handler<SessionUser>) =>
  wrap(async () => {
    const user = await getSession();
    if (!user) throw unauthorized();
    return user;
  }, fn);

/** Admins only — enforced here on the server, not just hidden in the UI. */
export const adminRoute = (fn: Handler<SessionUser>) =>
  wrap(async () => {
    const user = await getSession();
    if (!user) throw unauthorized();
    if (user.role !== 'admin') throw forbidden('This is only available to admins.');
    return user;
  }, fn);

export async function readBody<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw badRequest('The request body must be JSON.');
  }
  return schema.parse(json);
}

/** Query-string helpers that fail with a 400 instead of passing garbage upstream. */
export function query(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  return {
    str: (name: string) => sp.get(name)?.trim() || null,
    int(name: string): number | null {
      const v = sp.get(name);
      if (v == null || v.trim() === '') return null;
      const n = Number(v);
      if (!Number.isInteger(n)) throw badRequest(`${name} must be a whole number.`);
      return n;
    },
    date(name: string): string {
      const v = sp.get(name)?.trim() ?? '';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) throw badRequest('Choose a valid date range.');
      return v;
    },
  };
}

export function positiveId(raw: string | undefined, what = 'id'): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) throw badRequest(`Invalid ${what}.`);
  return n;
}

/**
 * Which wallet a report reads. A non-admin only ever reads their own wallet, whatever the
 * browser asks for. An admin may name any wallet — 0 pools every wallet on the client —
 * and otherwise gets `adminDefault`.
 */
export function reportWallet(user: SessionUser, requested: number | null, adminDefault: number): number {
  if (user.role !== 'admin') return ownWallet(user);
  return requested ?? adminDefault;
}

/**
 * The signed-in user's own wallet. Upstream, walletId 0 means "every wallet on the client",
 * so a missing wallet must stop the request rather than travel as 0.
 */
export function ownWallet(user: SessionUser): number {
  if (!user.walletId || user.walletId <= 0) throw new ApiError(404, 'No wallet is linked to this account yet.');
  return user.walletId;
}

import 'server-only';
import { env } from '@/server/config/env';
import { fields } from './fields';

export interface RemoteResult<T = unknown> {
  ok: boolean;
  statusCode: number;
  message: string;
  data: T | null;
}

const log = (level: 'warn' | 'error', path: string, detail: string) =>
  console[level](`[remote-api] ${path}: ${detail}`);

async function send(path: string, body: unknown): Promise<{ httpStatus: number; json: unknown } | { failure: string }> {
  const { REMOTE_API_BASE_URL, REMOTE_API_TIMEOUT_MS } = env();
  const url = new URL(path.replace(/^\//, ''), REMOTE_API_BASE_URL);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body ?? {}),
      cache: 'no-store',
      signal: AbortSignal.timeout(REMOTE_API_TIMEOUT_MS),
    });
    const text = await res.text();
    try {
      return { httpStatus: res.status, json: text ? JSON.parse(text) : null };
    } catch {
      // A route that is not deployed upstream answers non-2xx with an empty or HTML body —
      // a normal "this call failed", reported like any other refusal rather than thrown.
      return {
        failure: res.ok
          ? 'The payments service returned a response we could not read.'
          : `The payments service refused the request (${res.status}).`,
      };
    }
  } catch (err) {
    const timedOut = err instanceof DOMException && err.name === 'TimeoutError';
    log('error', path, timedOut ? 'timed out' : String(err));
    return { failure: timedOut ? 'The payments service took too long to answer.' : 'Could not reach the payments service.' };
  }
}

/**
 * Every action on the remote clients API — reads included — is a POST that answers
 * `{ status: "success" | "failure", statusCode, message, data }`. Request bodies are sent
 * with the exact field names the remote expects; callers spell them out.
 *
 * The envelope is read case-insensitively and accepts a boolean status too, because
 * Dashboard/Explain answers `{ "Status": true, "Data": … }` instead.
 */
export async function remotePost<T = unknown>(path: string, body?: Record<string, unknown>): Promise<RemoteResult<T>> {
  const sent = await send(path, body);
  if ('failure' in sent) return { ok: false, statusCode: 0, message: sent.failure, data: null };

  const f = fields(sent.json);
  const status = f.raw('status');
  const ok = typeof status === 'string' ? status.toLowerCase() === 'success' : status === true;
  const message = f.text('message');
  if (!ok) log('warn', path, message || `HTTP ${sent.httpStatus}`);
  return {
    ok,
    statusCode: f.num('statusCode') ?? sent.httpStatus,
    message,
    data: (f.raw('data') as T | undefined) ?? null,
  };
}

/** POST to an absolute URL outside the clients API (the BBPS service), returning the parsed body. */
export async function externalPost(
  url: string,
  body: unknown,
  timeoutMs: number,
): Promise<{ ok: true; httpStatus: number; json: unknown } | { ok: false; message: string }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await res.text();
    try {
      return { ok: true, httpStatus: res.status, json: text ? JSON.parse(text) : null };
    } catch {
      return { ok: false, message: `The biller service returned an unreadable response (${res.status}).` };
    }
  } catch (err) {
    const timedOut = err instanceof DOMException && err.name === 'TimeoutError';
    console.error(`[bbps] ${url}: ${String(err)}`);
    return { ok: false, message: timedOut ? 'The biller service took too long to answer.' : 'Could not reach the biller service.' };
  }
}

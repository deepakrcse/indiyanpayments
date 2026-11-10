/** A failed API call, carrying the server's message and any per-field errors. */
export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

function withQuery(path: string, query?: Query) {
  if (!query) return path;
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  const qs = sp.toString();
  return qs ? `${path}?${qs}` : path;
}

async function request<T>(method: string, path: string, body?: unknown, query?: Query): Promise<T> {
  let res: Response;
  try {
    res = await fetch(withQuery(path, query), {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
      cache: 'no-store',
    });
  } catch {
    throw new ApiClientError(0, 'Could not reach the server. Check your connection and try again.');
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // The session ended (midnight, or signed out in another tab): back to the login screen.
    if (res.status === 401 && typeof window !== 'undefined' && !path.startsWith('/api/auth/')) {
      // A full navigation on purpose: this module runs outside React, and the server layout must re-read the cookie.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    }
    const message = (data && typeof data.message === 'string' && data.message) || `Request failed (${res.status}).`;
    throw new ApiClientError(res.status, message, (data && data.fieldErrors) || {});
  }
  return data as T;
}

/** Typed fetch wrapper for this app's own API. Every error surfaces as ApiClientError. */
export const api = {
  get: <T>(path: string, query?: Query) => request<T>('GET', path, undefined, query),
  post: <T>(path: string, body?: unknown, query?: Query) => request<T>('POST', path, body ?? {}, query),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  del: <T = void>(path: string) => request<T>('DELETE', path),
};

export const errorMessage = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong.');

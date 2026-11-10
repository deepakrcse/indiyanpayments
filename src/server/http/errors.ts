import 'server-only';

/**
 * An error that maps straight to an HTTP response. Every API route answers failures as
 * `{ message, fieldErrors? }`, so the UI has exactly one shape to read.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const orDefault = (message: string | null | undefined, fallback: string) =>
  message && message.trim() ? message : fallback;

export const badRequest = (message: string, fieldErrors?: Record<string, string>) => new ApiError(400, message, fieldErrors);
export const unauthorized = (message = 'Please sign in again.') => new ApiError(401, message);
export const forbidden = (message = 'You do not have access to this.') => new ApiError(403, message);
export const notFound = (message = 'Not found.') => new ApiError(404, message);
export const conflict = (message: string) => new ApiError(409, message);
/** The remote understood the request and said no — its own words go to the person. */
export const unprocessable = (message: string | null | undefined, fallback: string) =>
  new ApiError(422, orDefault(message, fallback));
/** A service we call failed or is unreachable. */
export const badGateway = (message: string | null | undefined, fallback = 'The payments service did not respond as expected.') =>
  new ApiError(502, orDefault(message, fallback));
export const serviceUnavailable = (message: string) => new ApiError(503, message);

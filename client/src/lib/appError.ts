import { APP_ERROR_CODES, type AppErrorCode } from '@shared/errors';

/**
 * Pull the server's `AppErrorCode` off a failed tRPC call.
 *
 * The wire never carries prose: the server's errorFormatter attaches the code as `data.appCode` and
 * the client renders it via the `errors` namespace. Returns null when the failure carries no code
 * (a transport error, say), so callers can fall back to a generic message.
 */
export function appErrorCode(error: unknown): AppErrorCode | null {
  const code = (error as { data?: { appCode?: unknown } } | null | undefined)?.data?.appCode;
  if (typeof code !== 'string') return null;
  return (APP_ERROR_CODES as readonly string[]).includes(code) ? (code as AppErrorCode) : null;
}

import { TRPCError } from '@trpc/server';
import type { AppErrorCode } from '@shared/errors';

// Carries the shared AppErrorCode as the `cause` of a TRPCError so the errorFormatter can surface it
// as `error.data.appCode`. The wire never carries prose; the client maps the code to copy.
export class AppError extends Error {
  appCode: AppErrorCode;
  constructor(appCode: AppErrorCode) {
    super(appCode);
    this.name = 'AppError';
    this.appCode = appCode;
  }
}

const TRPC_CODE: Record<AppErrorCode, TRPCError['code']> = {
  LOBBY_NOT_FOUND: 'NOT_FOUND',
  LOBBY_FULL: 'BAD_REQUEST',
  NAME_TAKEN: 'CONFLICT',
  NOT_ADMIN: 'FORBIDDEN',
  GAME_ALREADY_STARTED: 'CONFLICT',
  RATE_LIMITED: 'TOO_MANY_REQUESTS',
  UNKNOWN: 'INTERNAL_SERVER_ERROR',
};

// Build a TRPCError that carries an AppErrorCode (never a localized sentence).
export function appError(code: AppErrorCode): TRPCError {
  return new TRPCError({
    code: TRPC_CODE[code],
    message: code,
    cause: new AppError(code),
  });
}

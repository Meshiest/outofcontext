/**
 * Application error codes carried on the wire instead of localized prose. The server throws a
 * TRPCError carrying one of these; the client renders `t('errors:' + code)`. The keys in
 * `client/src/locales/en/errors.json` are exactly these values.
 */
export type AppErrorCode =
  | 'LOBBY_NOT_FOUND'
  | 'LOBBY_FULL'
  | 'NAME_TAKEN'
  | 'NOT_ADMIN'
  | 'GAME_ALREADY_STARTED'
  | 'RATE_LIMITED'
  | 'UNKNOWN';

/** Runtime list of every AppErrorCode (e.g. to validate the errors.json key set). */
export const APP_ERROR_CODES: readonly AppErrorCode[] = [
  'LOBBY_NOT_FOUND',
  'LOBBY_FULL',
  'NAME_TAKEN',
  'NOT_ADMIN',
  'GAME_ALREADY_STARTED',
  'RATE_LIMITED',
  'UNKNOWN',
];

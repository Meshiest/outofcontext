import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { APP_ERROR_CODES } from '@shared/errors';
import { appError, AppError } from '../server/errors';

describe('AppErrorCode contract', () => {
  it('appError carries the code as an AppError cause (never prose)', () => {
    const e = appError('NOT_ADMIN');
    expect(e.cause instanceof AppError).toBe(true);
    expect((e.cause as AppError).appCode).toBe('NOT_ADMIN');
    // The message is the code itself, not a localized sentence.
    expect(e.message).toBe('NOT_ADMIN');
  });

  it('client errors.json keys stay in sync with the AppErrorCode enum', () => {
    const path = 'client/src/locales/en/errors.json';
    if (!existsSync(path)) {
      console.warn('errors.json not present yet; skipping sync assertion');
      return;
    }
    const json = JSON.parse(readFileSync(path, 'utf8')) as Record<
      string,
      string
    >;
    expect(new Set(Object.keys(json))).toEqual(new Set(APP_ERROR_CODES));
  });
});

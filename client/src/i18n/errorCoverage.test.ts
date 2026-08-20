import { describe, it, expect } from 'vitest';
import { APP_ERROR_CODES } from '@shared/errors';
import errors from '../locales/en/errors.json';

// The server sends AppErrorCode enums on the wire (never prose); the client renders
// t('errors:' + code). This gate keeps the errors.json key set in exact sync with the shared enum -
// a missing key would surface a raw code to the user, an extra key is dead copy.
describe('errors.json coverage', () => {
  const keys = Object.keys(errors);

  it('has a message for every AppErrorCode', () => {
    const missing = APP_ERROR_CODES.filter((code) => !(code in errors));
    expect(missing).toEqual([]);
  });

  it('has no message for an unknown code', () => {
    const extra = keys.filter((k) => !(APP_ERROR_CODES as readonly string[]).includes(k));
    expect(extra).toEqual([]);
  });

  it('every message is a non-empty ASCII string', () => {
    for (const [code, message] of Object.entries(errors)) {
      expect(typeof message, code).toBe('string');
      expect((message as string).length, code).toBeGreaterThan(0);
      // eslint-disable-next-line no-control-regex
      expect((message as string).match(/[^\x00-\x7F]/), code).toBeNull();
    }
  });
});

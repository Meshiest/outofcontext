import { describe, it, expect } from 'vitest';

describe('Backend smoke test', () => {
  it('runs in Node environment', () => {
    expect(typeof process.version).toBe('string');
  });
});

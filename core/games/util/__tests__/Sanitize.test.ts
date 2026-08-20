import { describe, it, expect } from 'vitest';
import { str } from '../Sanitize';

const ZW = {
  zwsp: String.fromCharCode(0x200b),
  zwnj: String.fromCharCode(0x200c),
  zwj: String.fromCharCode(0x200d),
  bom: String.fromCharCode(0xfeff),
};

describe('Sanitize.str', () => {
  it('removes zero-width characters', () => {
    const input = `a${ZW.zwsp}b${ZW.zwnj}c${ZW.zwj}d${ZW.bom}e`;
    expect(str(input)).toBe('abcde');
  });

  it('removes newlines and tabs', () => {
    expect(str('a\nb\tc')).toBe('abc');
  });

  it('trims leading and trailing whitespace', () => {
    expect(str('   hello world   ')).toBe('hello world');
  });

  it('returns empty string for non-string input', () => {
    expect(str(42)).toBe('');
    expect(str(null)).toBe('');
    expect(str(undefined)).toBe('');
    expect(str({})).toBe('');
    expect(str([])).toBe('');
  });

  it('returns empty string for empty input', () => {
    expect(str('')).toBe('');
  });

  it('passes a normal string through unchanged', () => {
    expect(str('The quick brown fox.')).toBe('The quick brown fox.');
  });
});

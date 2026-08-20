import '@/i18n';
import i18next from 'i18next';
import { describe, it, expect } from 'vitest';
import { CODE_CHARS, phoneticTable, toPhonetic } from './phonetic';

const en = () => phoneticTable(i18next);

describe('phoneticTable', () => {
  it('reads the spelling alphabet out of the active language', () => {
    expect(en()).toMatchObject({ a: 'alpha', z: 'zulu', '0': 'zero' });
  });

  it('covers every character a lobby code can contain', () => {
    // A partial table would spell half a code and pass the rest through raw, which reads as a typo.
    const table = en() ?? {};
    expect(CODE_CHARS.filter((ch) => !table[ch])).toEqual([]);
  });

  it('is null for a language that ships no alphabet', async () => {
    // The case this whole design exists for: a spelling alphabet is language-specific, and most
    // languages use their own rather than the NATO words, so a locale may simply not have one.
    //
    // A standalone instance, not a clone of the app's: the app pins supportedLngs to en/en-XA, so
    // every other language resolves BACK to en there and the guard would never be reached.
    const scoped = i18next.createInstance();
    await scoped.init({ lng: 'xx', resources: { xx: { lobby: { title: 'Lobby' } } } });
    expect(phoneticTable(scoped)).toBeNull();
  });
});

describe('toPhonetic', () => {
  it('spells letters and digits, using the custom digit words', () => {
    expect(toPhonetic('c0d3', en())).toBe('charlie - zero - delta - three');
  });

  it('is case-insensitive', () => {
    expect(toPhonetic('AB', en())).toBe('alpha - bravo');
  });

  it('covers every digit 0-9', () => {
    expect(toPhonetic('0123456789', en())).toBe(
      'zero - one - two - three - four - five - six - seven - eight - nine',
    );
  });

  it('renders nothing at all when the language has no alphabet', () => {
    // Not a fallback to English: a row of foreign words under a code the reader can already see
    // helps nobody. The caller treats the empty string as "omit the line".
    expect(toPhonetic('c0d3', null)).toBe('');
  });

  it('passes characters the table does not cover through unchanged', () => {
    expect(toPhonetic('a!', en())).toBe('alpha - !');
  });
});

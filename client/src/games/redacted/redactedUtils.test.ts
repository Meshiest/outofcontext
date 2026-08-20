import { describe, it, expect } from 'vitest';
import { WORD_REGEX, COST, getWords, wordCount, wordify, matchAllFill } from './redactedUtils';

describe('redactedUtils WORD_REGEX', () => {
  it('is a global unicode regex', () => {
    expect(WORD_REGEX.flags).toBe('gu');
    expect(WORD_REGEX.unicode).toBe(true);
  });
});

describe('getWords', () => {
  it('extracts plain words', () => {
    const words = getWords('hello world');
    expect(words.map((m) => m[0])).toEqual(['hello', 'world']);
  });

  it('treats a hyphenated word as one word', () => {
    const words = getWords('well-being matters');
    expect(words.map((m) => m[0])).toEqual(['well-being', 'matters']);
  });

  it('treats a straight-apostrophe contraction as one word', () => {
    const words = getWords("don't stop");
    expect(words.map((m) => m[0])).toEqual(["don't", 'stop']);
  });

  it('treats a curly-apostrophe contraction as one word', () => {
    // curly apostrophe U+2019 built via fromCharCode to keep this source ASCII
    const curly = 'don' + String.fromCharCode(0x2019) + 't';
    const words = getWords(curly + ' now');
    expect(words).toHaveLength(2);
    expect(words[0][0]).toBe(curly);
  });

  it('handles accented (unicode) letters', () => {
    // "cafe" with an acute e (U+00E9)
    const cafe = 'caf' + String.fromCharCode(0x00e9);
    const words = getWords(cafe + ' latte');
    expect(words.map((m) => m[0])).toEqual([cafe, 'latte']);
  });

  it('handles non-latin (CJK) letters as a word', () => {
    // three CJK ideographs
    const cjk = String.fromCharCode(0x65e5, 0x672c, 0x8a9e);
    expect(getWords(cjk)).toHaveLength(1);
  });
});

describe('wordCount', () => {
  it('returns 0 for empty', () => {
    expect(wordCount('')).toBe(0);
  });

  it('counts words', () => {
    expect(wordCount('one two three')).toBe(3);
  });

  it('counts hyphenated words once', () => {
    expect(wordCount('a-b c')).toBe(2);
  });
});

describe('matchAllFill', () => {
  it('returns an array of matches without mutating the source pattern lastIndex', () => {
    const matches = matchAllFill('a b c');
    expect(matches).toHaveLength(3);
    expect(WORD_REGEX.lastIndex).toBe(0);
  });
});

describe('wordify', () => {
  it('interleaves words and punctuation, dropping empty punctuation', () => {
    const { words, count } = wordify('hello world', 100, COST.truncate);
    expect(count).toBe(2);
    const values = words.map((w) => w.value);
    expect(values).toEqual(['hello', ' ', 'world']);
    const types = words.map((w) => w.type);
    expect(types).toEqual(['word', 'punctuation', 'word']);
  });

  it('marks availability by latter-half position and ink budget', () => {
    // ink 100 is plenty, so only the position rule (index >= floor(count/2)) gates availability
    const { words } = wordify('hello world', 100, COST.truncate);
    const wordSegs = words.filter((w) => w.type === 'word');
    expect(wordSegs[0].available).toBe(false); // index 0, first half
    expect(wordSegs[1].available).toBe(true); // index 1, latter half
  });

  it('restricts availability when ink is scarce', () => {
    // 4 words, ink 2, cost 2 -> only the very last word (cost 2) fits the budget
    const { words } = wordify('a b c d', 2, COST.truncate);
    const avail = words.filter((w) => w.type === 'word').map((w) => w.available);
    expect(avail).toEqual([false, false, false, true]);
  });
});

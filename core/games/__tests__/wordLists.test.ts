import fs from 'node:fs';
import { describe, it, expect } from 'vitest';
import GAMES from '../../../gameInfo';
import {
  DEFAULT_WORD_LIST,
  WORD_LISTS,
  isWordListId,
  loadWordList,
  type WordListId,
} from '../util/wordLists';

const ids = Object.keys(WORD_LISTS) as WordListId[];

describe('word lists', () => {
  it.each(ids)('%s loads a usable pool of words', (id) => {
    const words = loadWordList(id);
    // Enough that a full lobby (256 players x 5 words) never runs the sampler dry.
    expect(words.length).toBeGreaterThan(1500);
    expect(new Set(words).size).toBe(words.length);
    for (const word of words) {
      expect(word).not.toMatch(/\s/);
      expect([...word].length).toBeGreaterThanOrEqual(WORD_LISTS[id].minLength);
    }
  });

  it('keeps the English pool exactly as it was before lists became selectable', () => {
    // The band arithmetic it replaced - slice(3000, 8000 - 3000) - evaluated to slice(3000, 5000).
    // Reproduced here from the raw file so a change to the pool has to be deliberate.
    const raw = String(
      fs.readFileSync(new URL('../dicts/10000words.dict', import.meta.url)),
    ).split('\n');
    const expected = raw.slice(3000, 5000).filter((word) => word.length > 4);

    expect(loadWordList('en-common')).toEqual(expected);
  });

  it('exposes every list as a Wurderer config option, and no phantom ones', () => {
    // configVals() refuses to start a game when the stored option name is unknown, so a list
    // missing from gameInfo is unreachable and an option with no list would fail at load.
    const options = GAMES.assassin.config.wordList.options ?? [];
    expect(options.map((o) => o.name).sort()).toEqual([...ids].sort());
    expect(options.map((o) => o.value).sort()).toEqual([...ids].sort());
  });

  it('defaults to the English list, which is the one that ships hand-cleaned', () => {
    expect(DEFAULT_WORD_LIST).toBe('en-common');
    expect(GAMES.assassin.config.wordList.defaults).toBe(DEFAULT_WORD_LIST);
  });

  it('falls back to the default rather than starting a game with no words', () => {
    // A save written when a list existed, reopened after it was renamed or dropped.
    expect(loadWordList('nope-common')).toEqual(loadWordList(DEFAULT_WORD_LIST));
    expect(loadWordList(undefined)).toEqual(loadWordList(DEFAULT_WORD_LIST));
    expect(isWordListId('nope-common')).toBe(false);
    expect(isWordListId('en-common')).toBe(true);
  });

});

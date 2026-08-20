import fs from 'node:fs';

/**
 * The kill-word lists Wurderer can draw from.
 *
 * A list is picked per game through the `wordList` config option; the resolved value is the key
 * here. Files live in `core/games/dicts` as plain one-word-per-line text and are read lazily and
 * cached, so adding a language costs nothing until someone plays it.
 *
 * NON-ENGLISH LISTS ARE GENERATED, not hand-written: `scripts/generate-word-lists.mjs` pulls a
 * frequency-ranked band from hermitdave/FrequencyWords (OpenSubtitles-derived, CC-BY-SA 4.0) and
 * filters it for profanity, proper nouns, script and length. That filtering is best-effort - the
 * blocklists it leans on are thin for some languages - so the files are checked in as editable
 * text and are expected to be corrected by hand rather than treated as authoritative output.
 */
export interface WordListSpec {
  /** File under `core/games/dicts`. */
  file: string;
  /**
   * Minimum word length, in characters. Short words get said by accident within minutes, which
   * ends a round before it starts.
   */
  minLength: number;
  /**
   * Frequency band to take, for a file stored as a full ranked dump rather than a prepared list.
   * Only English needs this - the generated lists are already banded.
   */
  band?: readonly [number, number];
}

export const WORD_LISTS = {
  /**
   * The original hand-cleaned list: a full 10k frequency dump, banded at read time.
   *
   * The band is [3000, 5000] because that is what the previous code actually produced -
   * `slice(DICT_START, DICT_END - DICT_START)` with 3000/8000 evaluates to `slice(3000, 5000)`,
   * not the 3000-8000 the constant names imply. Preserved deliberately: widening it changes which
   * words the game can hand out, which is a content decision rather than a refactor.
   */
  'en-common': { file: '10000words.dict', minLength: 5, band: [3000, 5000] },
  'de-common': { file: 'de-common.dict', minLength: 5 },
  'es-common': { file: 'es-common.dict', minLength: 5 },
  'fr-common': { file: 'fr-common.dict', minLength: 5 },
} as const satisfies Record<string, WordListSpec>;

export type WordListId = keyof typeof WORD_LISTS;

export const DEFAULT_WORD_LIST: WordListId = 'en-common';

export function isWordListId(value: unknown): value is WordListId {
  return typeof value === 'string' && value in WORD_LISTS;
}

const cache = new Map<WordListId, string[]>();

function readDictFile(file: string): string[] {
  return String(fs.readFileSync(new URL(`../dicts/${file}`, import.meta.url))).split('\n');
}

/**
 * Load a list, falling back to the default for an unrecognised id.
 *
 * The fallback matters for a restored save: a lobby persisted while a list existed, then reopened
 * after it was renamed or removed, would otherwise start a game with no words to hand out.
 */
export function loadWordList(id: unknown): string[] {
  const listId: WordListId = isWordListId(id) ? id : DEFAULT_WORD_LIST;
  const cached = cache.get(listId);
  if (cached) return cached;

  const spec: WordListSpec = WORD_LISTS[listId];
  let words = readDictFile(spec.file);
  if (spec.band) words = words.slice(spec.band[0], spec.band[1]);
  words = words
    .map((word) => word.trim())
    .filter((word) => [...word].length >= spec.minLength);

  cache.set(listId, words);
  return words;
}

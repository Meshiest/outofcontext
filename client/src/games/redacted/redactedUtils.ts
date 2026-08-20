// Shared Redacted word-processing utilities. These mirror the server implementation in
// core/games/redacted.ts EXACTLY so the client's word splitting, costs, and availability math match
// what the server validates against. This module is the client's single source of truth for them.

// The word regex contains a curly apostrophe (U+2019) in its character class. To keep this source
// pure ASCII (project rule) while producing the byte-identical runtime regex the server uses, the
// curly apostrophe is injected via String.fromCharCode - exactly as core/games/redacted.ts does.
// Equivalent literal: /[\p{L}\p{M}\d]+(?:['-<curly-apos>-][\p{L}\p{M}\d]+)*/gu
const APOS = String.fromCharCode(0x2019); // right single quotation mark

/** Words: letters/marks/digits with internal apostrophes (straight/curly) and hyphens. */
export const WORD_REGEX = new RegExp(
  '[\\p{L}\\p{M}\\d]+(?:[' + "'-" + APOS + '-][\\p{L}\\p{M}\\d]+)*',
  'gu',
);

/** Ink cost per redacted word, by tamper mode. Identical to the server COST. */
export const COST = {
  truncate: 2,
  censor: 5,
} as const;

/**
 * Run a cloned copy of `pattern` (so the caller's regex lastIndex is never mutated) and collect
 * every match into an array.
 */
export function matchAllFill(str: string, pattern: RegExp = WORD_REGEX): RegExpExecArray[] {
  const clone = new RegExp(pattern.source, pattern.flags);
  const matches: RegExpExecArray[] = [];
  let match: RegExpExecArray | null;
  while ((match = clone.exec(str)) !== null) {
    matches.push(match);
    // Guard against a zero-width match causing an infinite loop (WORD_REGEX never matches empty,
    // but this keeps the helper safe for any pattern).
    if (match.index === clone.lastIndex) clone.lastIndex++;
  }
  return matches;
}

/** All word matches in `str` (array of match results, each with `index` + captured text at `[0]`). */
export function getWords(str: string): RegExpExecArray[] {
  return matchAllFill(str, WORD_REGEX);
}

/** Number of words in `str` (0 for empty/undefined). */
export function wordCount(str: string): number {
  return str ? getWords(str).length : 0;
}

// ---- wordify -----------------------------------------------------------------------------------

/** One interleaved segment of a tamperable line: a clickable word or the punctuation around it. */
export interface WordSegment {
  type: 'word' | 'punctuation';
  /** Word index (0..count-1) for words; the preceding-punctuation index for punctuation. */
  index: number;
  value: string;
  /**
   * Truncate-eligibility for a word: it is in the latter half of the line AND truncating from it
   * still fits the ink budget. Always false for punctuation. WordSelector (censor) ignores this and
   * gates on the selection count; TruncateSelector consumes it directly.
   */
  available: boolean;
}

export interface Wordified {
  /** Interleaved punctuation + word segments, empty-value punctuation removed. */
  words: WordSegment[];
  /** Number of words in the line. */
  count: number;
}

/**
 * Split a raw line into the interleaved word/punctuation array the tamper selectors render: split by
 * WORD_REGEX for punctuation, zip with the word matches, drop empty punctuation, and mark each word
 * `available` by position + ink budget for `costPerWord`.
 */
export function wordify(line: string, ink: number, costPerWord: number): Wordified {
  const punctuations: WordSegment[] = line.split(WORD_REGEX).map((s, i) => ({
    type: 'punctuation',
    index: i - 1,
    value: s,
    available: false,
  }));

  const rawWords = getWords(line);
  const count = rawWords.length;
  const words: WordSegment[] = rawWords.map((m, i) => ({
    type: 'word',
    index: i,
    value: m[0],
    available: i >= Math.floor(count / 2) && (count - i) * costPerWord <= ink,
  }));

  // Interleave punct[0], word[0], punct[1], word[1], ... then drop empty-value punctuation.
  const interleaved: WordSegment[] = [];
  for (let i = 0; i < punctuations.length; i++) {
    interleaved.push(punctuations[i]);
    if (words[i]) interleaved.push(words[i]);
  }
  const filtered = interleaved.filter((seg) => seg && seg.value);

  return { words: filtered, count };
}

/** Max words a player may censor: half the line, capped by ink budget. */
export function maxCensor(count: number, ink: number): number {
  return Math.min(Math.ceil(count / 2), Math.floor(ink / COST.censor));
}

/** Max words a player may truncate: half the line, capped by ink budget. */
export function maxTruncate(count: number, ink: number): number {
  return Math.min(Math.ceil(count / 2), Math.floor(ink / COST.truncate));
}

// ---- Link + result types -----------------------------------------------------------------------

export type TamperMode = 'censor' | 'truncate';

/** Per-mode configuration resolved from the lobby gamemode. */
export interface RedactedGamemode {
  censor: 'player' | 'random' | 'none';
  truncate: 'player' | 'random' | 'none';
}

/** A rendered line segment used by previews and results. */
export interface RedactedLineSegment {
  type: 'word' | 'punctuation' | 'count' | 'string';
  /** Text for word/punctuation/string segments; the hidden word's length (a number) for `count`. */
  value?: string | number;
  /** Word index the segment maps to (censor `count` blocks only). */
  index?: number;
  /** Gap ordinal for censor `count` blocks (0-based). */
  key?: number;
}

/** A rendered display line ({ line: segments }). */
export interface RedactedLineDisplay {
  line: RedactedLineSegment[];
}

/** No link (write first line) OR a `repair` link that carries continue-the-story context. */
export type RedactedWriteLink =
  | undefined
  | {
      type: 'repair';
      kind?: TamperMode;
      data: RedactedLineDisplay;
    };

/** The `line` link a player must tamper with; `data` is the raw written line. */
export interface RedactedTamperLink {
  type: 'line';
  data: string;
}

/** A censored `tamper` link awaiting repair. */
export interface RedactedCensorLink {
  type: 'tamper';
  kind: 'censor';
  data: {
    line: RedactedLineSegment[];
    indexes: number[];
  };
}

/** A truncated `tamper` link awaiting repair. */
export interface RedactedTruncateLink {
  type: 'tamper';
  kind: 'truncate';
  data: {
    line: string;
    length: number;
    count: number;
  };
}

/** In the repair phase the player sees the censor/truncate tamper link (same shapes). */
export type RedactedRepairCensorLink = RedactedCensorLink;
export type RedactedRepairTruncateLink = RedactedTruncateLink;

export type RedactedTamperRepairLink = RedactedCensorLink | RedactedTruncateLink;

export type RedactedLink =
  RedactedTamperLink | RedactedCensorLink | RedactedTruncateLink | NonNullable<RedactedWriteLink>;

/** Player state as seen by the Redacted client (extends the base PlayerState). */
export interface RedactedPlayerState {
  id: string;
  state: string;
  isLastLink?: boolean;
  link?: RedactedLink;
  /** READING / WAITING: reaction id -> whether this player left it on chain[i]. */
  reacted?: Record<string, boolean[]>;
}

/** Game state as seen by the Redacted client (extends the base GameState). */
export interface RedactedGameState {
  /** Reaction id -> per-chain count. */
  reactions?: Record<string, number[]>;
  icons: Record<string, string>;
  progress?: number;
  likes?: number[];
  isComplete?: boolean;
  gamemode: RedactedGamemode;
  ink: number;
}

/** One compiled line in a finished story (writer/tamperer/repairer). */
export interface RedactedResultEntry {
  data: { line: RedactedLineSegment[] | string };
  editors: [string, string, string];
}

/** A finished story is an ordered list of compiled lines. */
export type RedactedChain = RedactedResultEntry[];

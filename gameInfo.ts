import type { GameMeta } from '@shared/types';

/**
 * The SHAPE of every game: which config fields exist, their types, bounds, defaults, and the ids
 * of their list options. Nothing here is player-facing.
 *
 * All copy - titles, descriptions, how-to steps, field labels, option labels - lives in
 * client/src/locales/en/game-<id>.json, keyed by the ids used here. Adding a field or an option
 * means adding the matching locale entry; a coverage test fails when one is missing.
 */
const GAMES = {
  story: {
    config: {
      players: { type: 'int', min: 2, max: 256, defaults: '#numPlayers' },
      numStories: { type: 'int', min: 1, max: 256, defaults: '#numPlayers' },
      numLinks: { type: 'int', min: 3, max: 256, defaults: 10 },
      anonymous: { type: 'bool', defaults: 'false' },
      contextLen: {
        type: 'list', defaults: 'regular',
        options: [
          { name: 'regular', value: 1 },
          { name: 'two', value: 2 },
          { name: 'three', value: 3 },
          { name: 'four', value: 4 },
        ],
      },
    },
  },
  comic: {
    config: {
      players: { type: 'int', min: 2, max: 256, defaults: '#numPlayers' },
      numPieces: { type: 'int', min: 1, max: 256, defaults: '#numPlayers' },
      numLinks: { type: 'int', min: 3, max: 256, defaults: 4 },
      anonymous: { type: 'bool', defaults: 'false' },
      colors: { type: 'bool', defaults: 'false' },
      gamemode: {
        type: 'list', defaults: 'regular',
        options: [
          { name: 'regular', value: { continuous: false, captions: false, show_drawings: true, show_captions: false } },
          { name: 'collab', value: { continuous: true, captions: false, show_drawings: true, show_captions: false } },
          { name: 'both', value: { continuous: false, captions: true, show_drawings: true, show_captions: true } },
          { name: 'captions', value: { continuous: false, captions: true, show_drawings: false, show_captions: true } },
          { name: 'drawings', value: { continuous: false, captions: true, show_drawings: true, show_captions: false } },
        ],
      },
    },
  },
  draw: {
    config: {
      players: { type: 'int', min: 2, max: 256, defaults: '#numPlayers' },
      numLinks: { type: 'int', min: 3, max: 256, defaults: '#numPlayers' },
      colors: { type: 'bool', defaults: 'false' },
      timeLimit: {
        type: 'list', defaults: 'none',
        options: [
          { name: 'none', value: 0 },
          { name: 'sec5', value: 5 },
          { name: 'sec15', value: 15 },
          { name: 'sec30', value: 30 },
          { name: 'min1', value: 60 },
          { name: 'min2', value: 120 },
          { name: 'min5', value: 300 },
        ],
      },
    },
  },
  redacted: {
    config: {
      players: { type: 'int', min: 4, max: 256, defaults: '#numPlayers' },
      numStories: { type: 'int', min: 1, max: 256, defaults: '#numPlayers' },
      numLinks: { type: 'int', min: 2, max: 256, defaults: 6 },
      anonymous: { type: 'bool', defaults: 'false' },
      edits: {
        type: 'list', defaults: 'end',
        options: [
          { name: 'end', value: 1 },
          { name: 'always', value: 0 },
          { name: 'hide', value: 2 },
        ],
      },
      gamemode: {
        type: 'list', defaults: 'normal',
        options: [
          { name: 'normal', value: { censor: 'player', truncate: 'player' } },
          { name: 'censor', value: { censor: 'player', truncate: 'none' } },
          { name: 'madlib', value: { censor: 'random', truncate: 'none' } },
          { name: 'finish', value: { censor: 'none', truncate: 'player' } },
          { name: 'shred', value: { censor: 'none', truncate: 'random' } },
          { name: 'chaos', value: { censor: 'random', truncate: 'random' } },
        ],
      },
      ink: {
        type: 'list', defaults: 'normal',
        options: [
          { name: 'normal', value: 10 },
          { name: 'more', value: 15 },
          { name: 'many', value: 25 },
          { name: 'overkill', value: 500 },
        ],
      },
    },
  },
  recipe: {
    config: {
      players: { type: 'int', min: 2, max: 256, defaults: '#numPlayers' },
      numRecipes: { type: 'int', min: 1, max: 256, defaults: '#numPlayers' },
      numSteps: { type: 'int', min: 2, max: 256, defaults: 3 },
      anonymous: { type: 'bool', defaults: 'false' },
    },
  },
  assassin: {
    config: {
      players: { type: 'int', min: 2, max: 256, defaults: '#numPlayers' },
      numWords: { type: 'int', min: 1, max: 5, defaults: 2 },
      battleRoyale: { type: 'bool', defaults: 'false' },
      // Option names ARE the word-list ids in core/games/util/wordLists.ts. `configVals` refuses to
      // start a game whose stored option name is unknown, so the two must stay in step - which is
      // what the wordLists test asserts.
      wordList: {
        type: 'list', defaults: 'en-common',
        options: [
          { name: 'en-common', value: 'en-common' },
          { name: 'de-common', value: 'de-common' },
          { name: 'es-common', value: 'es-common' },
          { name: 'fr-common', value: 'fr-common' },
        ],
      },
    },
  },
} satisfies Record<string, GameMeta>;

export type GameKey = keyof typeof GAMES;
export default GAMES;

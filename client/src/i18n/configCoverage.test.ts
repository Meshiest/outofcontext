import { describe, it, expect } from 'vitest';
import GAMES from '@gameInfo';
import { en } from './resources';

/**
 * Every string a game shows must exist in that game's locale namespace.
 *
 * gameInfo.ts owns only the SHAPE - which fields exist, their types and bounds, and the ids of their
 * options - and the locale owns every word. Nothing falls back to English hardcoded in the source
 * any more, so a missing entry renders as blank rather than as readable text: this test is what
 * keeps that from reaching a page.
 */
type LocaleConfig = Record<
  string,
  {
    name?: string;
    text?: string;
    info?: string;
    options?: Record<string, string>;
    optionsMore?: Record<string, string>;
  }
>;

interface GameLocale {
  title?: string;
  subtitle?: string;
  difficulty?: string;
  description?: string;
  more?: string;
  howTo?: string[];
  playTime?: string;
  config?: LocaleConfig;
}

interface FieldDef {
  options?: Array<{ name: string }>;
}

const resources = en as unknown as Record<string, GameLocale>;
const games = Object.entries(
  GAMES as unknown as Record<string, { config?: Record<string, FieldDef> }>,
);

// The catalogue copy every game carries. `howTo` is a list; the rest are plain strings.
const META_KEYS = ['title', 'subtitle', 'difficulty', 'description', 'more', 'playTime'] as const;

describe('game locale coverage', () => {
  it.each(games.map(([id]) => id))('game-%s carries its catalogue copy', (gameId) => {
    const locale = resources[`game-${gameId}`] ?? {};
    const missing = META_KEYS.filter((key) => !locale[key]);
    if (!locale.howTo?.length) missing.push('howTo' as never);

    expect(missing, `missing copy in game-${gameId}`).toEqual([]);
  });

  it.each(games.map(([id]) => id))('game-%s covers every config field', (gameId) => {
    const meta = games.find(([id]) => id === gameId)?.[1];
    const localeConfig = resources[`game-${gameId}`]?.config ?? {};
    const missing: string[] = [];

    for (const [fieldName, def] of Object.entries(meta?.config ?? {})) {
      const entry = localeConfig[fieldName];
      if (!entry) {
        missing.push(fieldName);
        continue;
      }
      // All three are required now: `name` labels the admin control, `text` labels the read-only
      // stat, and `info` describes the field in the game's Configurations list.
      for (const key of ['name', 'text', 'info'] as const) {
        if (!entry[key]) missing.push(`${fieldName}.${key}`);
      }
      for (const option of def.options ?? []) {
        if (!entry.options?.[option.name]) missing.push(`${fieldName}.options.${option.name}`);
      }
    }

    expect(missing, `missing locale entries in game-${gameId}`).toEqual([]);
  });

  it('has no locale entries for config fields or options that no longer exist', () => {
    const orphans: string[] = [];
    for (const [gameId, meta] of games) {
      const fields = meta.config ?? {};
      for (const [fieldName, entry] of Object.entries(resources[`game-${gameId}`]?.config ?? {})) {
        const def = fields[fieldName];
        if (!def) {
          orphans.push(`game-${gameId}:${fieldName}`);
          continue;
        }
        const ids = new Set((def.options ?? []).map((option) => option.name));
        for (const key of Object.keys({ ...entry.options, ...entry.optionsMore })) {
          if (!ids.has(key)) orphans.push(`game-${gameId}:${fieldName}.${key}`);
        }
      }
    }
    expect(orphans).toEqual([]);
  });

  it('names the Wurderer word lists, which is what a player picks between', () => {
    const options = resources['game-assassin']?.config?.wordList?.options ?? {};
    expect(options['en-common']).toBe('English, Common');
    expect(Object.keys(options)).toHaveLength(4);
  });

  it('keeps the bare option label separate from the one that explains it', () => {
    // The read-only stat shows the bare value; the admin dropdown shows the expanded form. One
    // string for both put "Normal - 2 middle, 5 end" where a stat should just read "Normal".
    const ink = resources['game-redacted']?.config?.ink;
    expect(ink?.options?.normal).toBe('Normal');
    expect(ink?.optionsMore?.normal).toBe('Normal - 2 middle, 5 end');
  });
});

import type { i18n as I18n } from 'i18next';

/**
 * Look up a game's copy by its gameInfo id.
 *
 * Every game owns a `game-<id>` namespace, so both the namespace and the key are only known at
 * runtime. The typed `t` cannot express that - it knows only the literal keys of the namespace it
 * was created for - so these go through the raw i18n instance instead.
 *
 * A key missing from the active language falls back to `en` (i18next's own `fallbackLng`), and one
 * missing from `en` too yields an empty string rather than a raw key leaking into the UI. That is a
 * developer error, not a runtime state: the i18n coverage test fails when a game or a config field
 * has no entry.
 */
export function gameCopy(i18n: I18n, gameId: string, path: string): string {
  const key = `game-${gameId}:${path}`;
  if (!i18n.exists(key as never)) return '';
  return (i18n.t as unknown as (k: string) => string)(key);
}

/** As `gameCopy`, for a key holding a list (the how-to steps). Missing yields an empty list. */
export function gameCopyList(i18n: I18n, gameId: string, path: string): string[] {
  const key = `game-${gameId}:${path}`;
  if (!i18n.exists(key as never)) return [];
  const value = (i18n.t as unknown as (k: string, o: object) => unknown)(key, {
    returnObjects: true,
  });
  return Array.isArray(value) ? (value as string[]) : [];
}

/** Config copy lives under `config.<field>` in the same namespace. */
export function configCopy(i18n: I18n, gameId: string, path: string): string {
  return gameCopy(i18n, gameId, `config.${path}`);
}

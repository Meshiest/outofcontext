/**
 * The languages offered in the settings picker, in the order they are listed.
 *
 * Only the codes live here. Each language's own name is `language.native` in its `common.json`, so
 * the picker can show every option written in its own language - somebody who cannot read the
 * current UI still needs to find theirs. That also keeps this file ASCII.
 *
 * `en-XA` is deliberately absent: it is a QA pseudo-locale reached with `?lng=en-XA`, not something
 * to offer a player.
 */
export const LANGUAGES = ['en', 'de', 'es', 'fr'] as const;

export type LanguageCode = (typeof LANGUAGES)[number];

import type { i18n as I18n } from 'i18next';

/** Every character a lobby code can contain (see CODE_CHARS in core/Lobby.ts). */
export const CODE_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');

export type PhoneticTable = Record<string, string>;

/**
 * The spelling alphabet for the active language, or null when that language has none.
 *
 * Deliberately NOT falling back to English. The point of the line is to help someone read a code
 * aloud, and a reader who does not know the English alphabet gains nothing from "alpha bravo" - it
 * is a row of foreign words under a code they can already see. Better to show nothing. Locales that
 * want one supply their own: most languages have a national spelling alphabet rather than using the
 * NATO words (German Anton/Berta/Caesar, French Anatole/Berthe), so this is a translation, not a
 * transliteration of the English table.
 */
export function phoneticTable(i18n: I18n): PhoneticTable | null {
  const lng = i18n.resolvedLanguage ?? i18n.language;
  if (!lng) return null;
  const table = i18n.getResource(lng, 'lobby', 'phonetic') as PhoneticTable | undefined;
  if (!table || typeof table !== 'object') return null;
  return Object.keys(table).length > 0 ? table : null;
}

/**
 * Spell a lobby code out, e.g. "c0d3" -> "charlie - zero - delta - three". Returns an empty string
 * when there is no table, which is the caller's signal to render nothing at all.
 *
 * Characters the table does not cover pass through unchanged; codes are alphanumeric and a complete
 * table covers all of them, so this only shows up if a locale ships a partial one.
 */
export function toPhonetic(code: string, table: PhoneticTable | null): string {
  if (!table) return '';
  return code
    .toLowerCase()
    .split('')
    .map((ch) => table[ch] ?? ch)
    .join(' - ');
}

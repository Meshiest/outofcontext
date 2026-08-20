// Pseudo-locale `en-XA`, generated from `en` at load. Accents every letter, wraps each
// string in brackets, and pads it ~30% longer. Smoke any screen with `?lng=en-XA`: un-accented text
// is a hardcoded (untranslated) string to fix; clipped or overflowing text is a layout bug to fix.
// Interpolation placeholders ({{count}}) and <Trans> tag markers are left untouched so formatting and
// nesting still work under the pseudo-locale.
//
// The accent glyphs are the only intentionally non-ASCII output in the app; they are built from
// numeric code points via String.fromCharCode so THIS source file stays pure ASCII (mirroring how the
// redacted WORD_REGEX apostrophe and the gameInfo block char are built).

const ACCENT_CODES: Record<string, number> = {
  a: 0xe1,
  e: 0xe9,
  i: 0xed,
  o: 0xf3,
  u: 0xfa,
  y: 0xfd,
  A: 0xc1,
  E: 0xc9,
  I: 0xcd,
  O: 0xd3,
  U: 0xda,
  Y: 0xdd,
  c: 0xe7,
  n: 0xf1,
  s: 0x161,
  C: 0xc7,
  N: 0xd1,
  S: 0x160,
};

const ACCENT: Record<string, string> = Object.fromEntries(
  Object.entries(ACCENT_CODES).map(([letter, code]) => [letter, String.fromCharCode(code)]),
);

const PAD = String.fromCharCode(0xb7); // middle dot

// Split out {{...}} interpolation and <...> tag markers so we never mangle them.
const PRESERVE = /(\{\{[^}]*\}\}|<[^>]+>)/g;

function accentSegment(segment: string): string {
  let out = '';
  for (const ch of segment) out += ACCENT[ch] ?? ch;
  return out;
}

/** Accent + bracket + ~30% length-pad a single string, preserving placeholders and tags. */
export function pseudoize(value: string): string {
  const accented = value
    .split(PRESERVE)
    .map((part, i) => (i % 2 === 1 ? part : accentSegment(part)))
    .join('');
  const padCount = Math.max(1, Math.round(value.replace(PRESERVE, '').length * 0.3));
  return `[${accented}${PAD.repeat(padCount)}]`;
}

type MessageNode = string | string[] | MessageTree;
type MessageTree = { [key: string]: MessageNode };

/**
 * Recursively pseudoize every leaf string in a namespace message tree.
 *
 * Arrays are rebuilt as arrays (a game's `howTo` steps are one). Recursing into them as plain
 * objects would hand back `{0: ..., 1: ...}`, which `returnObjects` then yields instead of a list,
 * and the steps disappear from the page under the pseudo-locale.
 */
export function pseudoizeTree(tree: MessageTree): MessageTree {
  const out: MessageTree = {};
  for (const [key, val] of Object.entries(tree)) {
    if (typeof val === 'string') out[key] = pseudoize(val);
    else if (Array.isArray(val)) out[key] = val.map(pseudoize);
    else out[key] = pseudoizeTree(val);
  }
  return out;
}

/** Build an `en-XA` resource set from the `en` resource set (one pseudoized tree per namespace). */
export function buildPseudoResources(en: Record<string, MessageTree>): Record<string, MessageTree> {
  const out: Record<string, MessageTree> = {};
  for (const [ns, tree] of Object.entries(en)) out[ns] = pseudoizeTree(tree);
  return out;
}

/**
 * Regenerate the non-English Wurderer kill-word lists.
 *
 * Usage: node scripts/generate-word-lists.mjs [lang ...]      (default: all)
 *
 * Source: hermitdave/FrequencyWords, frequency-ranked words derived from the OpenSubtitles corpus,
 * licensed CC-BY-SA 4.0 (https://github.com/hermitdave/FrequencyWords). Attribution also belongs in
 * core/games/util/wordLists.ts, which is what the app reads.
 *
 * Band: ranks 2000-9000. Above that band the words are grammatical glue ("the", "and") that players
 * say by accident within seconds; below it they are rare enough that nobody says them at all. The
 * English list was hand-cut the same way and is NOT regenerated here - it has been manually cleaned
 * and is the reference for what good output looks like.
 *
 * IMPORTANT - profanity: the corpus is film and TV dialogue, so the raw band is full of slurs and
 * explicit terms. Everything is filtered against LDNOOBW's per-language blocklists plus a substring
 * pass for compounds. Those blocklists are small for some languages (66 entries for German), so
 * THIS FILTER IS NOT SUFFICIENT ON ITS OWN. Treat generated output as a draft that needs a native
 * speaker's pass before it ships; the .dict files are plain one-word-per-line and meant to be edited
 * by hand afterwards.
 */
import fs from 'node:fs';
import path from 'node:path';

const FREQ = (lang) =>
  `https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/${lang}/${lang}_50k.txt`;
const BAD_WORDS = (lang) =>
  `https://raw.githubusercontent.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/master/${lang}`;
// Subtitles are dialogue, so character names rank high enough to land squarely in the band. A name
// is a poor kill word - it is a thing you say ABOUT the game rather than in conversation - so they
// are filtered against a first-name database (MatthiasWinkelmann/firstname-database, ODbL).
const FIRST_NAMES =
  'https://raw.githubusercontent.com/MatthiasWinkelmann/firstname-database/master/firstnames.csv';

const BAND_START = 2000;
const BAND_END = 9000;
const OUT_DIR = path.join('core', 'games', 'dicts');

/**
 * Per-language rules.
 *
 * `script` accepts only words written entirely in the language's own alphabet, which drops the
 * corpus's English loanwords, transliterations and OCR debris. `minLength`/`maxLength` are in
 * characters: five is a sensible floor for alphabetic languages, but Chinese words are one to four
 * characters, so a five-character floor there would empty the list.
 */
const LANGS = {
  de: { source: 'de', bad: 'de', script: /^[a-zäöüß]+$/, minLength: 5, maxLength: 14 },
  es: { source: 'es', bad: 'es', script: /^[a-záéíóúüñ]+$/, minLength: 5, maxLength: 14 },
  fr: { source: 'fr', bad: 'fr', script: /^[a-zàâçéèêëîïôûùüÿœæ]+$/, minLength: 5, maxLength: 14 },
  zh: { source: 'zh_cn', bad: 'zh', script: /^[一-鿿]+$/, minLength: 2, maxLength: 4 },
};

async function get(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.text();
}

async function build(lang) {
  const spec = LANGS[lang];
  if (!spec) throw new Error(`unknown language: ${lang}`);

  const [freqRaw, badRaw, namesRaw] = await Promise.all([
    get(FREQ(spec.source)),
    get(BAD_WORDS(spec.bad)),
    get(FIRST_NAMES),
  ]);

  const ranked = freqRaw
    .split('\n')
    .map((line) => line.split(' ')[0]?.trim().toLowerCase())
    .filter(Boolean);

  const bad = badRaw
    .split('\n')
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 0);
  // Compounds matter: a blocklist entry rarely appears as a standalone token in German.
  const badSubstrings = bad.filter((w) => w.length >= 4);

  const names = new Set(
    namesRaw
      .split('\n')
      .slice(1)
      .map((line) => line.split(';')[0]?.trim().toLowerCase())
      .filter((n) => n && n.length >= 3),
  );

  const band = ranked.slice(BAND_START, BAND_END);
  const seen = new Set();
  const words = [];
  const dropped = { script: 0, length: 0, profanity: 0, name: 0, duplicate: 0 };

  for (const word of band) {
    if (!spec.script.test(word)) {
      dropped.script++;
      continue;
    }
    if ([...word].length < spec.minLength || [...word].length > spec.maxLength) {
      dropped.length++;
      continue;
    }
    if (bad.includes(word) || badSubstrings.some((b) => word.includes(b))) {
      dropped.profanity++;
      continue;
    }
    if (names.has(word)) {
      dropped.name++;
      continue;
    }
    if (seen.has(word)) {
      dropped.duplicate++;
      continue;
    }
    seen.add(word);
    words.push(word);
  }

  const out = path.join(OUT_DIR, `${lang}-common.dict`);
  fs.writeFileSync(out, words.join('\n') + '\n', 'utf8');
  console.log(
    `  ${lang}: ${String(words.length).padStart(5)} words -> ${out}` +
      `   (dropped: ${dropped.script} script, ${dropped.length} length, ` +
      `${dropped.profanity} profanity, ${dropped.name} names, ${dropped.duplicate} dupe)`,
  );
  return words.length;
}

const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(LANGS);
console.log(`\nBuilding word lists from ranks ${BAND_START}-${BAND_END}\n`);
for (const lang of wanted) await build(lang);
console.log('\nReminder: generated lists are a DRAFT. Have a native speaker review before shipping.\n');

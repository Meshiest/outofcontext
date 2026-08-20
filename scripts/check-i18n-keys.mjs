/**
 * CI gate: every `t()` key used in the client must exist in the `en` locale, and every `en` key
 * must be used.
 *
 * Compares KEY SETS rather than file contents. i18next-parser sorts its output alphabetically while
 * the committed files are grouped by meaning, so a "run the extractor and diff the files" gate fails
 * on ordering alone and teaches everyone to ignore it.
 *
 * Usage: node scripts/check-i18n-keys.mjs [--unused]
 *   --unused  also fail on keys defined in `en` that nothing references (off by default: a key can
 *             legitimately be referenced by a computed name, e.g. the per-game config lookups).
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CLIENT = 'client';
const LOCALES = join(CLIENT, 'src/locales/en');
const failOnUnused = process.argv.includes('--unused');

/** Flatten a namespace tree to dotted keys, treating an array leaf as one key. */
function keysOf(node, prefix = '', out = new Set()) {
  if (node === null || typeof node !== 'object' || Array.isArray(node)) {
    if (prefix) out.add(prefix);
    return out;
  }
  for (const [k, v] of Object.entries(node)) keysOf(v, prefix ? `${prefix}.${k}` : k, out);
  return out;
}

function readNamespaces(dir) {
  const out = new Map();
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    out.set(file.replace(/\.json$/, ''), keysOf(JSON.parse(readFileSync(join(dir, file), 'utf8'))));
  }
  return out;
}

const tmp = mkdtempSync(join(tmpdir(), 'i18n-gate-'));
try {
  // Extract into a throwaway directory so the working tree is never touched.
  execFileSync(
    'npx',
    ['i18next', '-c', 'i18next-parser.config.js', '-o', join(tmp, '$LOCALE/$NAMESPACE.json')],
    { cwd: CLIENT, stdio: 'pipe', shell: process.platform === 'win32' },
  );

  const extractedDir = join(tmp, 'en');
  if (!existsSync(extractedDir)) {
    console.error('i18n gate: the extractor produced no output - check i18next-parser.config.js');
    process.exit(1);
  }

  const found = readNamespaces(extractedDir);
  const have = readNamespaces(LOCALES);

  const missing = [];
  const unused = [];

  for (const [ns, keys] of found) {
    const defined = have.get(ns);
    for (const key of keys) {
      // The parser emits the key's own default as a placeholder when it cannot resolve it; a key it
      // could not parse is reported as missing here, which is the behaviour we want.
      if (!defined || !defined.has(key)) missing.push(`${ns}:${key}`);
    }
  }

  for (const [ns, keys] of have) {
    const used = found.get(ns);
    for (const key of keys) if (!used || !used.has(key)) unused.push(`${ns}:${key}`);
  }

  if (missing.length) {
    console.error(`i18n gate: ${missing.length} key(s) used in code but absent from en/`);
    for (const k of missing.sort()) console.error('  ' + k);
  }
  if (unused.length) {
    const label = failOnUnused ? 'unused' : 'unused (not failing)';
    console.error(`i18n gate: ${unused.length} key(s) defined in en/ but not referenced [${label}]`);
    for (const k of unused.sort().slice(0, 40)) console.error('  ' + k);
    if (unused.length > 40) console.error(`  ... and ${unused.length - 40} more`);
  }

  if (missing.length || (failOnUnused && unused.length)) process.exit(1);
  console.log(`i18n gate: OK - every key used in code exists in en/ (${found.size} namespaces)`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

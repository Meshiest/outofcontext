import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import glob from 'glob';
import { isValidDrawingBytes } from '../shared/drawing.js';

/**
 * Content-addressed store for drawing bitmaps.
 *
 * Drawings do not travel inside game messages. A client uploads the bytes once, gets an id back,
 * and only the id crosses the realtime transport - so a finished 8-player Dilettante result is a
 * few hundred bytes of ids rather than tens of megabytes of inlined base64, and each image is
 * fetched over a plain cacheable GET instead of being re-sent to every player.
 *
 * Backed by disk, mirroring Persistence: a lobby that empties is saved and culled from memory, then
 * restored when someone rejoins the code. If drawings lived only in memory those restored saves
 * would come back with every image missing.
 *
 * The id is a content hash, which buys deduplication (two identical drawings are one file) and
 * makes every URL immutable, so it can be cached forever.
 */

const DIR = path.join('persistence', 'drawings');

/** Matches Persistence's save expiry, since drawings and saves age out together. */
const EXPIRE_TIME = 1000 * 60 * 60 * 24 * 30;

/** How many recently-touched images to keep decoded in memory. Bounded so a busy server cannot grow without limit. */
const CACHE_MAX_ENTRIES = 256;

// Insertion-ordered, so the oldest key is the first one Map iteration yields - enough for an LRU
// eviction without pulling in a dependency.
const cache = new Map<string, Buffer>();

function remember(id: string, bytes: Buffer): void {
  cache.delete(id);
  cache.set(id, bytes);
  while (cache.size > CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

const fileFor = (id: string): string => path.join(DIR, `${id}.img`);

/** A drawing id: 128 bits of SHA-256, hex. Validated before ever touching the filesystem. */
const ID_PATTERN = /^[0-9a-f]{32}$/;

export function isDrawingId(value: unknown): value is string {
  return typeof value === 'string' && ID_PATTERN.test(value);
}

export function idFor(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex').slice(0, 32);
}

/**
 * Validate and store an uploaded drawing, returning its id, or null when the bytes are not an
 * acceptable drawing. Never throws: this is reachable by any lobby member.
 */
export function store(bytes: Uint8Array): string | null {
  if (!isValidDrawingBytes(bytes)) return null;
  const id = idFor(bytes);
  const buf = Buffer.from(bytes);
  try {
    fs.mkdirSync(DIR, { recursive: true });
    // Content-addressed, so an existing file with this name is byte-identical - skip the rewrite
    // and let its mtime age naturally.
    if (!fs.existsSync(fileFor(id))) {
      fs.writeFileSync(fileFor(id), buf);
    }
  } catch (err) {
    console.error(new Date(), 'error storing drawing', id, err);
    return null;
  }
  remember(id, buf);
  return id;
}

/** Read a drawing back, from cache or disk. Null when it is unknown or expired. */
export function load(id: string): Buffer | null {
  if (!isDrawingId(id)) return null;
  const cached = cache.get(id);
  if (cached) {
    remember(id, cached);
    return cached;
  }
  try {
    const bytes = fs.readFileSync(fileFor(id));
    remember(id, bytes);
    return bytes;
  } catch {
    return null;
  }
}

export function exists(id: string): boolean {
  if (!isDrawingId(id)) return false;
  return cache.has(id) || fs.existsSync(fileFor(id));
}

/** Drop expired drawings. Called from the same cron that culls lobby saves. */
export function cullDrawings(): number {
  let count = 0;
  try {
    const files = glob.sync(path.join(DIR, '*.img').replace(/\\/g, '/'), {});
    for (const file of files) {
      try {
        const stat = fs.statSync(file);
        if (Date.now() - EXPIRE_TIME > stat.mtimeMs) {
          fs.unlinkSync(file);
          cache.delete(path.basename(file, '.img'));
          ++count;
        }
      } catch {
        // ignore missing/unreadable files
      }
    }
  } catch {
    // the directory may not exist yet
  }
  if (count > 0) console.log(new Date(), '!- culled', count, 'old drawings');
  return count;
}

/** Test seam: forget everything cached in memory. */
export function clearCache(): void {
  cache.clear();
}

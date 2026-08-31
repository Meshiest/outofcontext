import pako from 'pako';
import fs from 'node:fs';
import glob from 'glob';
import type { Lobby, LobbySaveState } from './Lobby.js';

// ~1 month expire time
const EXPIRE_TIME = 1000 * 60 * 60 * 24 * 30;

const SAVE_DIR = 'persistence';
const SAVE_SUFFIX = '.json.zip';

const saveName = (code: string): string => `${SAVE_DIR}/${code}${SAVE_SUFFIX}`;

export function saveExists(code: string): boolean {
  return fs.existsSync(saveName(code));
}

// remove an expired lobby save; returns true if it was culled
function cullSave(filename: string): boolean {
  try {
    const stat = fs.statSync(filename);
    if (Date.now() - EXPIRE_TIME > stat.ctimeMs) {
      fs.unlinkSync(filename);
      return true;
    }
  } catch {
    // ignore missing/unreadable files
  }

  return false;
}

export function cullSaves(): number {
  const files = glob.sync(saveName('*'), {});
  let count = 0;
  for (const f of files) {
    if (cullSave(f)) ++count;
  }
  if (count > 0) console.log(new Date(), '!- culled', count, 'old saves');
  return count;
}

/**
 * How many lobby saves are on disk. Read fresh rather than tracked in a counter: shutdown handlers
 * and cron write here too, so a counter would drift.
 *
 * No filesystem reports a file count, so enumeration is unavoidable; readdirSync measured fastest,
 * ahead of an opendirSync walk and glob. Suffix alone is the filter - isFile() can cost a stat per
 * entry.
 */
export function countSaves(): number {
  let count = 0;
  try {
    for (const name of fs.readdirSync(SAVE_DIR)) {
      if (name.endsWith(SAVE_SUFFIX)) ++count;
    }
  } catch {
    return 0; // no store yet, or unreadable
  }
  return count;
}

export function saveLobbyState(lobby: Lobby): void {
  console.log(new Date(), `-- [lobby ${lobby.code}] saved`);
  const state = lobby.saveState();
  const data = pako.deflate(JSON.stringify(state));
  const fd = fs.openSync(saveName(lobby.code), 'w');
  try {
    fs.writeSync(fd, data);
  } finally {
    fs.closeSync(fd);
  }
}

export function restoreLobbyState(code: string): LobbySaveState {
  const data = fs.readFileSync(saveName(code));
  const state = JSON.parse(pako.inflate(data, { to: 'string' })) as LobbySaveState;
  return state;
}

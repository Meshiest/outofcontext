import pako from 'pako';
import fs from 'node:fs';
import glob from 'glob';
import type { Lobby, LobbySaveState } from './Lobby.js';

// ~1 month expire time
const EXPIRE_TIME = 1000 * 60 * 60 * 24 * 30;

const saveName = (code: string): string => `persistence/${code}.json.zip`;

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

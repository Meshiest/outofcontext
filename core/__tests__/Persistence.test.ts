import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import fs from 'node:fs';
import * as Persistence from '../Persistence';

const CODES: string[] = [];
function tempCode(): string {
  const code = 'testlobby_' + Math.random().toString(36).slice(2, 10);
  CODES.push(code);
  return code;
}

function saveFile(code: string): string {
  return `persistence/${code}.json.zip`;
}

beforeAll(() => {
  fs.mkdirSync('persistence', { recursive: true });
});

afterEach(() => {
  for (const code of CODES.splice(0)) {
    try {
      fs.unlinkSync(saveFile(code));
    } catch {
      // already gone
    }
  }
});

describe('Persistence', () => {
  it('saveExists reflects whether a save file is present', () => {
    const code = tempCode();
    expect(Persistence.saveExists(code)).toBe(false);
    Persistence.saveLobbyState({
      code,
      saveState: () => ({ version: 1, code }),
    } as never);
    expect(Persistence.saveExists(code)).toBe(true);
  });

  it('round-trips lobby state through pako compression', () => {
    const code = tempCode();
    const state = {
      version: 1,
      code,
      lobbyState: 'WAITING',
      players: [{ playerId: 'p1', name: 'Ada' }],
      nested: { a: 1, b: [2, 3] },
    };
    Persistence.saveLobbyState({ code, saveState: () => state } as never);

    // The stored file is compressed (not plain JSON text).
    const raw = fs.readFileSync(saveFile(code));
    expect(raw.length).toBeGreaterThan(0);
    expect(raw.includes(Buffer.from('"version"'))).toBe(false);

    const restored = Persistence.restoreLobbyState(code);
    expect(restored).toEqual(state);
  });

  it('cullSaves leaves a freshly written save in place', () => {
    const code = tempCode();
    Persistence.saveLobbyState({
      code,
      saveState: () => ({ version: 1, code }),
    } as never);
    Persistence.cullSaves();
    expect(Persistence.saveExists(code)).toBe(true);
  });
});

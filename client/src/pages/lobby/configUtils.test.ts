import { describe, it, expect } from 'vitest';
import type { ConfigFieldDef, LobbyInfo } from '@shared/types';
import {
  canJoinPlayers,
  configValue,
  deriveConfigText,
  deriveConfigValue,
  invalidConfig,
} from './configUtils';

const intNumPlayers: ConfigFieldDef = {
  type: 'int',
  min: 2,
  max: 256,
  defaults: '#numPlayers',
};

const intMinFour: ConfigFieldDef = {
  ...intNumPlayers,
  min: 4,
};

const intPlain: ConfigFieldDef = {
  type: 'int',
  min: 3,
  max: 256,
  defaults: 10,
};

const boolCfg: ConfigFieldDef = {
  type: 'bool',
  defaults: 'false',
};

const listCfg: ConfigFieldDef = {
  type: 'list',
  defaults: 'regular',
  options: [
    { name: 'regular', value: 1 },
    { name: 'two', value: 2 },
  ],
};

const labels = { yes: 'Yes', no: 'No', unknown: '???' };

function makeLobby(overrides: Partial<LobbyInfo> = {}): LobbyInfo {
  return {
    game: 'story',
    state: 'WAITING',
    config: {},
    admin: 'a',
    gameState: { icons: {} },
    members: [],
    players: [],
    spectators: [],
    ...overrides,
  };
}

describe('configValue', () => {
  it('returns the lobby override when present', () => {
    expect(configValue({ numLinks: 5 }, intPlain, 'numLinks')).toBe(5);
  });

  it('falls back to the game default', () => {
    expect(configValue({}, intPlain, 'numLinks')).toBe(10);
  });
});

describe('deriveConfigValue', () => {
  it('resolves #numPlayers to min(playerCount, max) for int', () => {
    expect(deriveConfigValue(intNumPlayers, '#numPlayers', 4)).toBe(4);
    expect(deriveConfigValue(intNumPlayers, '#numPlayers', 999)).toBe(256);
  });

  it('passes a plain int through', () => {
    expect(deriveConfigValue(intPlain, 10, 4)).toBe(10);
    expect(deriveConfigValue(intPlain, '12', 4)).toBe(12);
  });

  it('passes bool and list values through as strings', () => {
    expect(deriveConfigValue(boolCfg, 'true', 4)).toBe('true');
    expect(deriveConfigValue(listCfg, 'two', 4)).toBe('two');
  });
});

describe('deriveConfigText', () => {
  it('int -> the derived number', () => {
    expect(deriveConfigText(intNumPlayers, '#numPlayers', 3, labels)).toBe('3');
  });

  it('bool -> Yes / No', () => {
    expect(deriveConfigText(boolCfg, 'true', 4, labels)).toBe('Yes');
    expect(deriveConfigText(boolCfg, 'false', 4, labels)).toBe('No');
  });

  // Option ids are the only thing the shape carries; their labels come from the locale, which is
  // what `translateOption` reaches. A known id with no translation is still not a value to show.
  it('list -> the translated label for a matching option id', () => {
    const translate = (name: string) => (name === 'two' ? '2 Lines' : null);
    expect(deriveConfigText(listCfg, 'two', 4, labels, translate)).toBe('2 Lines');
    expect(deriveConfigText(listCfg, 'nope', 4, labels, translate)).toBe('???');
    expect(deriveConfigText(listCfg, 'regular', 4, labels, translate)).toBe('???');
  });
});

describe('canJoinPlayers', () => {
  it('is true when no game is selected', () => {
    expect(canJoinPlayers(makeLobby({ config: {} }), undefined)).toBe(true);
  });

  it('is true when the player count is flexible (#numPlayers)', () => {
    const lobby = makeLobby({ config: { players: '#numPlayers' }, players: [] });
    const meta = { config: { players: { max: 8 } } } as unknown as Parameters<
      typeof canJoinPlayers
    >[1];
    expect(canJoinPlayers(lobby, meta)).toBe(true);
  });

  it('is false when a fixed max is set and players already exist', () => {
    const lobby = makeLobby({
      config: { players: 4 },
      players: [
        { id: 'x', playerId: 'x', connected: true, name: 'X' },
        { id: 'y', playerId: 'y', connected: true, name: 'Y' },
      ],
    });
    const meta = { config: { players: { max: 8 } } } as unknown as Parameters<
      typeof canJoinPlayers
    >[1];
    expect(canJoinPlayers(lobby, meta)).toBe(false);
  });
});

describe('invalidConfig', () => {
  it('is true when a #numPlayers int would resolve below its min', () => {
    const lobby = makeLobby({
      config: { players: '#numPlayers' },
      players: [{ id: 'x', playerId: 'x', connected: true, name: 'X' }],
    });
    const meta = { config: { players: intMinFour } } as unknown as Parameters<
      typeof invalidConfig
    >[1];
    expect(invalidConfig(lobby, meta)).toBe(true);
  });

  it('is false when the player count meets the min', () => {
    const lobby = makeLobby({
      config: { players: '#numPlayers' },
      players: [
        { id: '1', playerId: '1', connected: true, name: 'A' },
        { id: '2', playerId: '2', connected: true, name: 'B' },
        { id: '3', playerId: '3', connected: true, name: 'C' },
        { id: '4', playerId: '4', connected: true, name: 'D' },
      ],
    });
    const meta = { config: { players: intMinFour } } as unknown as Parameters<
      typeof invalidConfig
    >[1];
    expect(invalidConfig(lobby, meta)).toBe(false);
  });

  it('is false when no game is selected', () => {
    expect(invalidConfig(makeLobby(), undefined)).toBe(false);
  });
});

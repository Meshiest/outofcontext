import { describe, it, expect, afterEach } from 'vitest';
import { Lobby } from '../Lobby';
import { Member } from '../Member';

const CREATED: string[] = [];
function track(code: string): void {
  CREATED.push(code);
}
function named(name: string): Member {
  const m = new Member();
  m.name = name;
  return m;
}

afterEach(() => {
  for (const code of CREATED.splice(0)) Lobby.cull(code);
});

describe('Lobby core', () => {
  it('newCode generates a fresh 4-char code', () => {
    const code = Lobby.newCode();
    expect(code.length).toBe(4);
    expect(Lobby.lobbyExists(code)).toBe(false);
  });

  it('create registers the lobby in Lobby.lobbies', () => {
    const code = Lobby.newCode();
    const lobby = Lobby.create(code);
    track(code);
    expect(Lobby.lobbies[code]).toBe(lobby);
    expect(lobby.lobbyState).toBe('WAITING');
  });

  it('addMember seats a named member as a player and delegates admin', () => {
    const lobby = Lobby.create(Lobby.newCode());
    track(lobby.code);
    const a = named('Ada');
    a.lobby = lobby;
    lobby.addMember(a);
    expect(lobby.players.length).toBe(1);
    expect(lobby.players[0].name).toBe('Ada');
    expect(lobby.admin).toBe(a.id);
  });

  it('removeMember disconnects the player and clears admin', () => {
    const lobby = Lobby.create(Lobby.newCode());
    track(lobby.code);
    const a = named('Ada');
    a.lobby = lobby;
    lobby.addMember(a);
    lobby.removeMember(a);
    // In WAITING, disconnected players are culled from the list.
    expect(lobby.players.length).toBe(0);
    expect(lobby.admin).toBe('');
  });

  it('setGame selects the game and resets config to its defaults', () => {
    const lobby = Lobby.create(Lobby.newCode());
    track(lobby.code);
    lobby.setGame('story');
    expect(lobby.selectedGame).toBe('story');
    expect(lobby.gameConfig.numLinks).toBe(10);
    expect(lobby.gameConfig.anonymous).toBe('false');
  });

  it('setConfig validates int (in-range and over-max clamp)', () => {
    const lobby = Lobby.create(Lobby.newCode());
    track(lobby.code);
    lobby.setGame('story');
    lobby.setConfig('numLinks', 20);
    expect(lobby.gameConfig.numLinks).toBe(20);
    lobby.setConfig('numLinks', 9999);
    expect(lobby.gameConfig.numLinks).toBe(256); // clamped to max
  });

  it('setConfig coerces bool and validates list options', () => {
    const lobby = Lobby.create(Lobby.newCode());
    track(lobby.code);
    lobby.setGame('story');
    lobby.setConfig('anonymous', 'true');
    expect(lobby.gameConfig.anonymous).toBe('true');
    lobby.setConfig('anonymous', 'nonsense');
    expect(lobby.gameConfig.anonymous).toBe('false');

    lobby.setConfig('contextLen', 'two');
    expect(lobby.gameConfig.contextLen).toBe('two');
    lobby.setConfig('contextLen', 'bogus');
    expect(lobby.gameConfig.contextLen).toBe('regular'); // falls back to default
  });

  it('startGame builds a game instance and endGame resets to WAITING', () => {
    const lobby = Lobby.create(Lobby.newCode());
    track(lobby.code);
    for (const name of ['Ada', 'Bo']) {
      const m = named(name);
      m.lobby = lobby;
      lobby.addMember(m);
    }
    lobby.setGame('story');
    lobby.startGame();
    expect(lobby.lobbyState).toBe('PLAYING');
    expect(lobby.game).toBeTruthy();
    expect(lobby.gameConfig.players).toBe(2);

    lobby.endGame();
    expect(lobby.lobbyState).toBe('WAITING');
    expect(lobby.game).toBeNull();
  });

  it('toggleSpectate moves a player into the spectators list', () => {
    const lobby = Lobby.create(Lobby.newCode());
    track(lobby.code);
    const a = named('Ada');
    a.lobby = lobby;
    lobby.addMember(a);
    lobby.toggleSpectate(a);
    expect(lobby.spectators.find((s) => s.id === a.id)).toBeTruthy();
    expect(lobby.players.find((p) => p.id === a.id)).toBeFalsy();
  });

  it('saveState / restoreState round-trips lobby data', () => {
    const lobby = Lobby.create(Lobby.newCode());
    track(lobby.code);
    for (const name of ['Ada', 'Bo']) {
      const m = named(name);
      m.lobby = lobby;
      lobby.addMember(m);
    }
    lobby.setGame('story');
    lobby.startGame();

    const blob = lobby.saveState();
    const restored = new Lobby(blob);
    expect(restored.code).toBe(lobby.code);
    expect(restored.selectedGame).toBe('story');
    expect(restored.players.length).toBe(2);
    expect(restored.game).toBeTruthy();
    expect(restored.lobbyState).toBe('PLAYING');
  });

  describe('cullEmpty (fixed no-op bug)', () => {
    it('removes a stale empty lobby but keeps recent / non-empty / persistent ones', () => {
      const stale = new Lobby();
      stale.created = Date.now() - 120_000;
      Lobby.lobbies[stale.code] = stale;
      track(stale.code);

      const recent = new Lobby();
      Lobby.lobbies[recent.code] = recent;
      track(recent.code);

      const staleButFull = new Lobby();
      staleButFull.created = Date.now() - 120_000;
      const m = named('Ada');
      m.lobby = staleButFull;
      staleButFull.addMember(m);
      Lobby.lobbies[staleButFull.code] = staleButFull;
      track(staleButFull.code);

      const culled = Lobby.cullEmpty();

      expect(culled).toBeGreaterThanOrEqual(1);
      expect(Lobby.lobbies[stale.code]).toBeUndefined(); // stale + empty -> gone
      expect(Lobby.lobbies[recent.code]).toBe(recent); // recent -> kept
      expect(Lobby.lobbies[staleButFull.code]).toBe(staleButFull); // non-empty -> kept
      expect(Lobby.lobbies['devaaaa']).toBeTruthy(); // persist dev lobby -> kept
    });
  });
});

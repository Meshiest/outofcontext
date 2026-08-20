import { vi } from 'vitest';

// A minimal stand-in for Lobby covering the surface the game classes touch: the emit helpers and
// endGame. Returned spies let tests assert what was broadcast.
export function makeMockLobby() {
  return {
    emitAll: vi.fn(),
    emitPlayer: vi.fn(),
    emitPlayers: vi.fn(),
    emitMember: vi.fn(),
    endGame: vi.fn(),
    sendLobbyInfo: vi.fn(),
    genLobbyInfo: vi.fn(),
  };
}

export type MockLobby = ReturnType<typeof makeMockLobby>;

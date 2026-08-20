import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { PlayerInfo } from '@shared/types';

const h = vi.hoisted(() => ({
  lobbyInfo: null as { players: PlayerInfo[] } | null,
}));

vi.mock('@/contexts/LobbyContext', () => ({
  useLobbyInfo: () => ({ lobbyInfo: h.lobbyInfo, code: null, playerId: '', nameOk: null }),
}));

import { buildNameTable, useNameTable } from './useNameTable';

const players: PlayerInfo[] = [
  { id: '1', playerId: 'p1', connected: true, name: 'Alice' },
  { id: '2', playerId: 'p2', connected: false, name: 'Bob' },
];

describe('buildNameTable', () => {
  it('maps playerId to name', () => {
    expect(buildNameTable(players)).toEqual({ p1: 'Alice', p2: 'Bob' });
  });

  it('returns an empty object for undefined', () => {
    expect(buildNameTable(undefined)).toEqual({});
  });
});

describe('useNameTable', () => {
  it('derives the table from lobby players', () => {
    h.lobbyInfo = { players };
    const { result } = renderHook(() => useNameTable());
    expect(result.current).toEqual({ p1: 'Alice', p2: 'Bob' });
  });

  it('is empty before lobby info arrives', () => {
    h.lobbyInfo = null;
    const { result } = renderHook(() => useNameTable());
    expect(result.current).toEqual({});
  });
});

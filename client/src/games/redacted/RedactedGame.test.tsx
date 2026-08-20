import '@/i18n';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { RedactedChain } from './redactedUtils';

// Mutable hook state shared across the mocks below.
const h = vi.hoisted(() => ({
  gameState: null as unknown,
  playerInfo: null as unknown,
  results: [] as unknown[],
  sendGameMessage: vi.fn(),
}));

vi.mock('@/hooks/useGame', () => ({
  useGame: () => ({
    gameState: h.gameState,
    playerInfo: h.playerInfo,
    sendGameMessage: h.sendGameMessage,
    startGame: vi.fn(),
    endGame: vi.fn(),
  }),
}));
vi.mock('../shared/useGameResults', () => ({
  useGameResults: () => ({ results: h.results, requestResults: vi.fn() }),
}));
vi.mock('../shared/useNameTable', () => ({ useNameTable: () => ({}) }));
vi.mock('../shared/useTurnEffects', () => ({ useTurnEffects: () => {} }));

import RedactedGame from './RedactedGame';

beforeEach(() => {
  h.gameState = {
    icons: {},
    progress: 0.5,
    gamemode: { censor: 'player', truncate: 'player' },
    ink: 100,
  };
  h.playerInfo = null;
  h.results = [];
  h.sendGameMessage.mockClear();
});
afterEach(cleanup);

describe('RedactedGame routing', () => {
  it('routes no link -> write editor', () => {
    h.playerInfo = { id: 'me', state: 'EDITING' };
    render(<RedactedGame />);
    expect(screen.getByText('Write the first line')).toBeInTheDocument();
  });

  it("routes a 'line' link -> tamper editor", () => {
    h.playerInfo = { id: 'me', state: 'EDITING', link: { type: 'line', data: 'alpha beta gamma' } };
    render(<RedactedGame />);
    expect(screen.getByText('Tamper With the Story')).toBeInTheDocument();
  });

  it("routes a 'tamper' (censor) link -> repair editor", () => {
    h.playerInfo = {
      id: 'me',
      state: 'EDITING',
      link: {
        type: 'tamper',
        kind: 'censor',
        data: { line: [{ type: 'count', index: 0, key: 0, value: 4 }], indexes: [0] },
      },
    };
    render(<RedactedGame />);
    expect(screen.getByText('Decensor Text')).toBeInTheDocument();
  });

  it("routes a 'repair' link -> write editor with context", () => {
    h.playerInfo = {
      id: 'me',
      state: 'EDITING',
      link: {
        type: 'repair',
        data: { line: [{ type: 'punctuation', value: 'The story so far.' }] },
      },
    };
    render(<RedactedGame />);
    expect(screen.getByText('Continue the Story')).toBeInTheDocument();
    expect(screen.getByText('The story so far.')).toBeInTheDocument();
  });

  it('shows the waiting loader in WAITING', () => {
    h.playerInfo = { id: 'me', state: 'WAITING' };
    render(<RedactedGame />);
    expect(screen.getByText('Waiting on Other Players')).toBeInTheDocument();
  });

  it('shows results in READING', () => {
    const chains: RedactedChain[] = [
      [
        {
          data: { line: [{ type: 'punctuation', value: 'A finished tale.' }] },
          editors: ['', '', ''],
        },
      ],
    ];
    h.results = chains;
    h.gameState = {
      icons: { me: 'clock' },
      progress: 1,
      gamemode: { censor: 'player', truncate: 'player' },
      ink: 100,
    };
    h.playerInfo = { id: 'me', state: 'READING', liked: [false] };
    render(<RedactedGame />);
    expect(screen.getByText('A finished tale.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Done Reading/i })).toBeInTheDocument();
  });
});

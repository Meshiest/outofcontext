import '@/i18n';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';

const mocks = vi.hoisted(() => ({
  createLobby: vi.fn(),
  leaveLobby: vi.fn(),
  navigate: vi.fn(),
  conn: { everConnected: true, connected: true, disconnected: false },
  lobbyInfo: {
    lobbyInfo: null as unknown,
    code: null as string | null,
    playerId: 'p1',
    nameOk: null as boolean | null,
  },
}));

// Keep the page hermetic: stub the settings-bearing shell and the (separately tested) modal.
vi.mock('@/components/widgets/PageWrapper', () => ({
  PageWrapper: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('./JoinLobbyModal', () => ({
  JoinLobbyModal: ({ open }: { open: boolean }) => (open ? <div data-testid="join-modal" /> : null),
}));
vi.mock('@/hooks/useLobby', () => ({
  useLobby: () => ({
    createLobby: mocks.createLobby,
    leaveLobby: mocks.leaveLobby,
    creatingLobby: false,
  }),
}));
vi.mock('@/contexts/LobbyContext', () => ({
  useConnection: () => mocks.conn,
  useLobbyInfo: () => mocks.lobbyInfo,
}));
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useNavigate: () => mocks.navigate };
});

import { HomePage } from './HomePage';

function renderHome() {
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mocks.conn = { everConnected: true, connected: true, disconnected: false };
  mocks.lobbyInfo = { lobbyInfo: null, code: null, playerId: 'p1', nameOk: null };
  mocks.createLobby.mockReset();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('HomePage', () => {
  it('renders the title and subtitle', () => {
    renderHome();
    // The title is the wordmark now, so its words are split across elements by the ink block.
    expect(screen.getByText('Context')).toBeInTheDocument();
    expect(screen.getByText('Party games fueled by your insanity!')).toBeInTheDocument();
  });

  it('leaves any stale lobby once on mount', () => {
    renderHome();
    expect(mocks.leaveLobby).toHaveBeenCalledTimes(1);
  });

  it('creates a lobby when Create Lobby is clicked', async () => {
    const user = userEvent.setup();
    renderHome();
    await user.click(screen.getByRole('button', { name: /create lobby/i }));
    expect(mocks.createLobby).toHaveBeenCalledTimes(1);
  });

  it('opens the join modal when Join Lobby is clicked', async () => {
    const user = userEvent.setup();
    renderHome();
    expect(screen.queryByTestId('join-modal')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /join lobby/i }));
    expect(screen.getByTestId('join-modal')).toBeInTheDocument();
  });

  it('renders the info links with correct hrefs', () => {
    renderHome();
    expect(screen.getByRole('link', { name: /game info/i })).toHaveAttribute('href', '/games');
    expect(screen.getByRole('link', { name: /read the code/i })).toHaveAttribute(
      'href',
      'https://github.com/meshiest/outofcontext',
    );
    expect(screen.getByRole('link', { name: /request a game/i })).toHaveAttribute(
      'href',
      'https://github.com/meshiest/outofcontext/issues/new',
    );
  });

  it('navigates to the code the create mutation returns, ignoring any stale context code', () => {
    // Navigation uses the authoritative code the server returns via the mutation's onSuccess, not a
    // code lingering in context (LobbyProvider sits above the router and the server never pushes
    // lobby:leave to a leaver), so it is race-free and never routes back to an old lobby.
    mocks.lobbyInfo = { lobbyInfo: null, code: 'abcd', playerId: 'p1', nameOk: null };
    mocks.createLobby.mockImplementation((onCode?: (code: string) => void) => onCode?.('efgh'));
    renderHome();

    fireEvent.click(screen.getByRole('button', { name: /create lobby/i }));
    expect(mocks.createLobby).toHaveBeenCalledTimes(1);
    expect(mocks.navigate).toHaveBeenCalledWith('/lobby/efgh');
    expect(mocks.navigate).not.toHaveBeenCalledWith('/lobby/abcd');
  });

  it('disables the lobby buttons while not connected', () => {
    mocks.conn = { everConnected: false, connected: false, disconnected: false };
    renderHome();
    expect(screen.getByRole('button', { name: /create lobby/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /join lobby/i })).toBeDisabled();
  });
});

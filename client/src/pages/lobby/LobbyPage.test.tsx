import '@/i18n';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { StrictMode, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import type { LobbyInfo } from '@shared/types';

const mocks = vi.hoisted(() => ({
  exists: vi.fn(() => Promise.resolve(true)),
  joinLobby: vi.fn(),
  createLobby: vi.fn(),
  navigate: vi.fn(),
  routeCode: 'wxyz' as string | undefined,
  isAdmin: false,
  conn: { connected: true, disconnected: false, everConnected: true },
  info: {
    lobbyInfo: null as LobbyInfo | null,
    code: null as string | null,
    playerId: 'p1',
    nameOk: null as boolean | null,
  },
  prefs: { streamerMode: false },
  rocketcrab: null as unknown,
}));

vi.mock('@/components/widgets/PageWrapper', () => ({
  PageWrapper: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('./NameEntry', () => ({ NameEntry: () => <div data-testid="name-entry" /> }));
vi.mock('./LobbyWaiting', () => ({ LobbyWaiting: () => <div data-testid="lobby-waiting" /> }));
vi.mock('./LobbyPlaying', () => ({ LobbyPlaying: () => <div data-testid="lobby-playing" /> }));
vi.mock('@/pages/JoinLobbyModal', () => ({
  JoinLobbyModal: ({ open }: { open: boolean }) => (open ? <div data-testid="join-modal" /> : null),
}));
// Return FRESH function identities each render (delegating to the stable spies), matching the real
// useLobby whose tRPC-mutation-derived callbacks are recreated every render. This is what makes the
// validation effect vulnerable to the "cancel-on-rerender" hang if it lists joinLobby as a dep.
vi.mock('@/hooks/useLobby', () => ({
  useLobby: () => ({
    joinLobby: (code: string) => mocks.joinLobby(code),
    createLobby: () => mocks.createLobby(),
    creatingLobby: false,
  }),
}));
vi.mock('@/hooks/useLobbyAdmin', () => ({
  useLobbyAdmin: () => ({ isAdmin: mocks.isAdmin }),
}));
vi.mock('@/contexts/LobbyContext', () => ({
  useConnection: () => mocks.conn,
  useLobbyInfo: () => mocks.info,
}));
vi.mock('@/contexts/PreferencesContext', () => ({
  usePreferences: () => mocks.prefs,
}));
vi.mock('@/hooks/useRocketCrab', () => ({
  useRocketCrab: () => mocks.rocketcrab,
}));
vi.mock('@/trpc/trpc', () => ({
  trpc: { useUtils: () => ({ lobby: { exists: { fetch: mocks.exists } } }) },
}));
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
    useParams: () => ({ code: mocks.routeCode }),
  };
});

import { LobbyPage } from './LobbyPage';

function makeLobbyInfo(state: 'WAITING' | 'PLAYING'): LobbyInfo {
  return {
    game: 'story',
    state,
    config: {},
    admin: 'p1',
    gameState: { icons: {} },
    members: [],
    players: [],
    spectators: [],
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <LobbyPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mocks.exists.mockResolvedValue(true);
  mocks.routeCode = 'wxyz';
  mocks.isAdmin = false;
  mocks.conn = { connected: true, disconnected: false, everConnected: true };
  mocks.info = { lobbyInfo: null, code: null, playerId: 'p1', nameOk: null };
  mocks.prefs = { streamerMode: false };
  mocks.rocketcrab = null;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('LobbyPage state machine', () => {
  it('validates a valid code, joins, and shows name entry', async () => {
    mocks.exists.mockResolvedValue(true);
    renderPage();
    expect(await screen.findByTestId('name-entry')).toBeInTheDocument();
    expect(mocks.exists).toHaveBeenCalledWith('wxyz');
    expect(mocks.joinLobby).toHaveBeenCalledWith('wxyz');
  });

  it('does not cancel the in-flight validation fetch when the component re-renders (no hang)', async () => {
    // Regression: the validation effect must not list the churning joinLobby/utils as deps. If it
    // does, a re-render while the fetch is pending re-runs the effect, whose prior cleanup cancels the
    // fetch with no retry -> stuck LOADING, never joins.
    let resolveExists!: (ok: boolean) => void;
    mocks.exists.mockImplementation(
      () => new Promise<boolean>((resolve) => (resolveExists = resolve)),
    );

    const { rerender } = renderPage();
    rerender(
      <MemoryRouter>
        <LobbyPage />
      </MemoryRouter>,
    );
    rerender(
      <MemoryRouter>
        <LobbyPage />
      </MemoryRouter>,
    );

    resolveExists(true);
    await waitFor(() => expect(mocks.joinLobby).toHaveBeenCalledWith('wxyz'));
    expect(await screen.findByTestId('name-entry')).toBeInTheDocument();
    expect(mocks.exists).toHaveBeenCalledTimes(1); // validated once, not refetched per render
  });

  it('resolves under a StrictMode double-invoke without hanging (dev remount)', async () => {
    // Regression for the join / lobby-entry stuck-loader bug: in dev, StrictMode mounts, unmounts,
    // then remounts. A "already validated this code" ref-guard makes the remount skip re-fetching
    // while the first mount's fetch was cancelled by its cleanup -> `result` never set -> stuck on
    // the LOADING overlay.
    let resolveExists!: (ok: boolean) => void;
    mocks.exists.mockImplementation(
      () => new Promise<boolean>((resolve) => (resolveExists = resolve)),
    );

    render(
      <StrictMode>
        <MemoryRouter>
          <LobbyPage />
        </MemoryRouter>
      </StrictMode>,
    );

    resolveExists(true);
    expect(await screen.findByTestId('name-entry')).toBeInTheDocument();
    expect(mocks.joinLobby).toHaveBeenCalledWith('wxyz');
  });

  it('shows the NO_LOBBY screen for an invalid code', async () => {
    mocks.exists.mockResolvedValue(false);
    renderPage();
    expect(await screen.findByText('Invalid Lobby')).toBeInTheDocument();
    expect(screen.queryByTestId('name-entry')).not.toBeInTheDocument();
  });

  it('shows NO_LOBBY without validating a code shorter than 4 chars', () => {
    mocks.routeCode = 'abc';
    renderPage();
    expect(screen.getByText('Invalid Lobby')).toBeInTheDocument();
    expect(mocks.exists).not.toHaveBeenCalled();
  });

  it('shows the waiting room once the name is accepted (server WAITING)', async () => {
    mocks.info = {
      lobbyInfo: makeLobbyInfo('WAITING'),
      code: 'wxyz',
      playerId: 'p1',
      nameOk: true,
    };
    renderPage();
    expect(await screen.findByTestId('lobby-waiting')).toBeInTheDocument();
  });

  it('shows the playing screen when the server lobby is PLAYING', async () => {
    mocks.info = {
      lobbyInfo: makeLobbyInfo('PLAYING'),
      code: 'wxyz',
      playerId: 'p1',
      nameOk: true,
    };
    renderPage();
    expect(await screen.findByTestId('lobby-playing')).toBeInTheDocument();
  });

  it('keeps the game mounted during a transient disconnect (does not drop to NO_LOBBY)', async () => {
    // A blip must not unmount the live screen (that would discard in-progress input); the game/name
    // screen stays and the global ConnectionOverlay (outside LobbyPage) signals the reconnect.
    mocks.info = {
      lobbyInfo: makeLobbyInfo('WAITING'),
      code: 'wxyz',
      playerId: 'p1',
      nameOk: true,
    };
    mocks.conn = { connected: false, disconnected: true, everConnected: true };
    renderPage();
    expect(await screen.findByTestId('lobby-waiting')).toBeInTheDocument();
    expect(screen.queryByText('Invalid Lobby')).not.toBeInTheDocument();
  });

  it('re-validates the lobby on reconnect', async () => {
    mocks.exists.mockResolvedValue(true);
    const { rerender } = renderPage();
    await screen.findByTestId('name-entry');
    expect(mocks.exists).toHaveBeenCalledTimes(1);

    mocks.conn = { connected: false, disconnected: true, everConnected: true };
    rerender(
      <MemoryRouter>
        <LobbyPage />
      </MemoryRouter>,
    );

    mocks.conn = { connected: true, disconnected: false, everConnected: true };
    rerender(
      <MemoryRouter>
        <LobbyPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(mocks.exists.mock.calls.length).toBeGreaterThanOrEqual(2));
  });

  it('creates a lobby and opens the join modal from NO_LOBBY', async () => {
    mocks.exists.mockResolvedValue(false);
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Invalid Lobby');

    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(mocks.createLobby).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Join' }));
    expect(screen.getByTestId('join-modal')).toBeInTheDocument();
  });
});

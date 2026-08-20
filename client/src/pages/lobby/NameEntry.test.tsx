import '@/i18n';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import type { LobbyInfo } from '@shared/types';
import { installLocalStorageMock } from '@/test/localStorageMock';
import { PreferencesProvider } from '@/contexts/PreferencesContext';

const mocks = vi.hoisted(() => ({
  submitName: vi.fn(),
  replaceMember: vi.fn(),
  navigate: vi.fn(),
  nameLoading: false,
  nameValid: null as boolean | null,
  nameOk: null as boolean | null,
  lobbyInfo: null as LobbyInfo | null,
  validLobby: true,
  rocketcrab: null as { name: string; isHost: boolean } | null,
  code: 'wxyz' as string | undefined,
  navigationType: 'PUSH' as 'PUSH' | 'POP' | 'REPLACE',
}));

vi.mock('@/hooks/useMemberName', () => ({
  useMemberName: () => ({
    submitName: mocks.submitName,
    nameLoading: mocks.nameLoading,
    nameValid: mocks.nameValid,
  }),
}));
vi.mock('@/contexts/LobbyContext', () => ({
  useLobbyInfo: () => ({ nameOk: mocks.nameOk, lobbyInfo: mocks.lobbyInfo }),
}));
vi.mock('@/hooks/useLobby', () => ({
  useLobby: () => ({ validLobby: mocks.validLobby, replaceMember: mocks.replaceMember }),
}));
vi.mock('@/hooks/useRocketCrab', () => ({
  useRocketCrab: () => mocks.rocketcrab,
}));
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
    useParams: () => ({ code: mocks.code }),
    useNavigationType: () => mocks.navigationType,
  };
});

import { NameEntry } from './NameEntry';

/** A lobby whose only player is a disconnected seat holding `name`. */
function lobbyWithGhost(name: string): LobbyInfo {
  return {
    code: 'wxyz',
    state: 'WAITING',
    players: [{ playerId: 'p1', id: 'old', name, connected: false }],
    spectators: [],
    members: [],
  } as unknown as LobbyInfo;
}

function renderNameEntry() {
  return render(
    <PreferencesProvider>
      <NameEntry />
    </PreferencesProvider>,
  );
}

beforeEach(() => {
  installLocalStorageMock();
  mocks.nameLoading = false;
  mocks.nameValid = null;
  mocks.nameOk = null;
  mocks.lobbyInfo = null;
  mocks.validLobby = true;
  mocks.rocketcrab = null;
  mocks.code = 'wxyz';
  mocks.navigationType = 'PUSH';
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('NameEntry', () => {
  it('enforces the 1-15 character length constraints', () => {
    renderNameEntry();
    const input = screen.getByLabelText('Name');
    expect(input).toHaveAttribute('minlength', '1');
    expect(input).toHaveAttribute('maxlength', '15');
  });

  it('pre-fills from the stored name (localStorage oocName)', () => {
    localStorage.setItem('oocName', 'Bob');
    renderNameEntry();
    expect(screen.getByLabelText('Name')).toHaveValue('Bob');
  });

  it('persists the name to localStorage and submits it', async () => {
    const user = userEvent.setup();
    renderNameEntry();
    await user.type(screen.getByLabelText('Name'), 'Cara');
    await user.click(screen.getByRole('button', { name: 'Join' }));
    expect(localStorage.getItem('oocName')).toBe('Cara');
    expect(mocks.submitName).toHaveBeenCalledWith('Cara', undefined);
  });

  it('shows an error when the server rejects the name', () => {
    mocks.nameOk = false;
    renderNameEntry();
    expect(screen.getByRole('alert')).toHaveTextContent('That name is already taken');
  });

  it('navigates home when Leave is clicked', async () => {
    const user = userEvent.setup();
    renderNameEntry();
    await user.click(screen.getByRole('button', { name: 'Leave' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/');
  });

  it('reclaims a disconnected seat without prompting on a direct load', () => {
    // A reload or a pasted link: the player is coming BACK, so slotting them in is the point.
    localStorage.setItem('oocName', 'Ada');
    mocks.navigationType = 'POP';
    mocks.lobbyInfo = lobbyWithGhost('Ada');
    renderNameEntry();
    expect(mocks.submitName).toHaveBeenCalledWith('Ada', expect.any(Function));
  });

  it('does NOT auto-rejoin when arriving from the join screen', () => {
    // Entering a code deliberately should ask who you are, not silently reinsert you under the
    // name you happened to use last.
    localStorage.setItem('oocName', 'Ada');
    mocks.navigationType = 'PUSH';
    mocks.lobbyInfo = lobbyWithGhost('Ada');
    renderNameEntry();
    expect(mocks.submitName).not.toHaveBeenCalled();
    expect(mocks.replaceMember).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Join' })).toBeInTheDocument();
  });

  it('claims the seat only AFTER the name is accepted, never alongside it', async () => {
    const user = userEvent.setup();
    localStorage.setItem('oocName', 'Ada');
    mocks.lobbyInfo = lobbyWithGhost('Ada');
    renderNameEntry();

    await user.click(screen.getByRole('button', { name: 'Join' }));

    // Sequenced, not fired together: the client batches concurrent mutations, and the server drops
    // a replace that arrives before the member has a name.
    expect(mocks.replaceMember).not.toHaveBeenCalled();
    const [, onAccepted] = mocks.submitName.mock.calls[0];
    onAccepted();
    expect(mocks.replaceMember).toHaveBeenCalledWith('p1');
  });
});

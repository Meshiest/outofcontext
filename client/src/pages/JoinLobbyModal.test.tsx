import '@/i18n';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import type { ReactNode } from 'react';

const mocks = vi.hoisted(() => ({
  joinLobby: vi.fn(),
  navigate: vi.fn(),
  onClose: vi.fn(),
  exists: vi.fn(),
  conn: { everConnected: true, connected: true, disconnected: false },
  prefs: { streamerMode: false },
}));

// The native <dialog> is separately tested; render children plainly so userEvent can interact.
vi.mock('@/components/ui/Modal/Modal', () => ({
  Modal: ({ open, children }: { open: boolean; children?: ReactNode }) =>
    open ? <div>{children}</div> : null,
}));
vi.mock('@/hooks/useLobby', () => ({
  useLobby: () => ({ joinLobby: mocks.joinLobby }),
}));
vi.mock('@/contexts/LobbyContext', () => ({
  useConnection: () => mocks.conn,
}));
vi.mock('@/contexts/PreferencesContext', () => ({
  usePreferences: () => ({ streamerMode: mocks.prefs.streamerMode }),
}));
vi.mock('@/trpc/trpc', () => ({
  trpc: { useUtils: () => ({ lobby: { exists: { fetch: mocks.exists } } }) },
}));
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useNavigate: () => mocks.navigate };
});

import { JoinLobbyModal } from './JoinLobbyModal';

function renderModal(open = true) {
  render(<JoinLobbyModal open={open} onClose={mocks.onClose} />);
}

beforeEach(() => {
  mocks.conn = { everConnected: true, connected: true, disconnected: false };
  mocks.prefs = { streamerMode: false };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('JoinLobbyModal', () => {
  it('lowercases and strips non-alphanumerics as the user types', async () => {
    const user = userEvent.setup();
    renderModal();
    const input = screen.getByLabelText('Lobby Code');
    await user.type(input, 'AB_c-d');
    expect(input).toHaveValue('abcd');
  });

  it('keeps codes longer than four characters', async () => {
    // Codes are not fixed-length: newCode() grows them on collision and RocketCrab lobbies carry an
    // `rc` prefix, so capping the field at 4 made those lobbies impossible to join.
    const user = userEvent.setup();
    renderModal();
    const input = screen.getByLabelText('Lobby Code');
    await user.type(input, 'rcab12');
    expect(input).toHaveValue('rcab12');
  });

  it('caps the code at the length the server accepts', async () => {
    const user = userEvent.setup();
    renderModal();
    const input = screen.getByLabelText('Lobby Code');
    await user.type(input, 'a'.repeat(40));
    expect(input).toHaveValue('a'.repeat(32));
  });

  it('validates, joins, and navigates on a valid code', async () => {
    mocks.exists.mockResolvedValue(true);
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText('Lobby Code'), 'abcd');
    await user.click(screen.getByRole('button', { name: 'Join' }));
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/lobby/abcd'));
    expect(mocks.exists).toHaveBeenCalledWith('abcd');
    expect(mocks.joinLobby).toHaveBeenCalledWith('abcd');
    expect(mocks.onClose).toHaveBeenCalled();
  });

  it('shows an error and does not join when the code is invalid', async () => {
    mocks.exists.mockResolvedValue(false);
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByLabelText('Lobby Code'), 'abcd');
    await user.click(screen.getByRole('button', { name: 'Join' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid lobby code');
    expect(mocks.joinLobby).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(mocks.onClose).not.toHaveBeenCalled();
  });

  it('clears the error when the input changes', async () => {
    mocks.exists.mockResolvedValue(false);
    const user = userEvent.setup();
    renderModal();
    const input = screen.getByLabelText('Lobby Code');
    await user.type(input, 'abcd');
    await user.click(screen.getByRole('button', { name: 'Join' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    await user.type(input, 'x');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mocks.onClose).toHaveBeenCalled();
  });

  it('masks the code input in streamer mode', () => {
    mocks.prefs = { streamerMode: true };
    renderModal();
    expect(screen.getByLabelText('Lobby Code')).toHaveAttribute('type', 'password');
  });

  it('closes when the connection drops while open', () => {
    mocks.conn = { everConnected: true, connected: false, disconnected: true };
    renderModal(true);
    expect(mocks.onClose).toHaveBeenCalled();
  });
});

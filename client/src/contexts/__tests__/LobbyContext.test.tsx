import '@/i18n';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import type { LobbyInfo } from '@shared/types';
import { LobbyProvider, useLobbyInfo, useEmoteEvents } from '@/contexts/LobbyContext';
import { ConnectionOverlay } from '@/components/ConnectionOverlay';
import { installLocalStorageMock } from '@/test/localStorageMock';

// Control the lobby.onInfo subscription: capture its onData callback and drive its status.
const h = vi.hoisted(() => ({
  onData: undefined as undefined | ((ev: { event: string; args: unknown[] }) => void),
  status: 'connecting' as string,
}));

vi.mock('@/trpc/trpc', () => ({
  trpc: {
    lobby: {
      onInfo: {
        useSubscription: (
          _input: unknown,
          opts: { onData: (ev: { event: string; args: unknown[] }) => void },
        ) => {
          h.onData = opts.onData;
          return { status: h.status };
        },
      },
    },
    game: {
      onState: { useSubscription: () => ({ status: h.status }) },
    },
  },
}));

function emit(ev: { event: string; args: unknown[] }) {
  act(() => h.onData?.(ev));
}

function Consumer() {
  const { lobbyInfo, code, playerId } = useLobbyInfo();
  const emotes = useEmoteEvents();
  return (
    <div>
      <span data-testid="code">{code ?? ''}</span>
      <span data-testid="admin">{lobbyInfo?.admin ?? ''}</span>
      <span data-testid="playerId">{playerId}</span>
      <span data-testid="emotes">{emotes.map((e) => e.emote).join(',')}</span>
    </div>
  );
}

const sampleLobby: LobbyInfo = {
  game: 'story',
  state: 'WAITING',
  config: {},
  admin: 'm1',
  gameState: { icons: {} },
  members: [],
  players: [],
  spectators: [],
};

beforeEach(() => {
  installLocalStorageMock();
  h.onData = undefined;
  h.status = 'connecting';
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('LobbyProvider event handling', () => {
  it('applies lobby:join and lobby:info', () => {
    render(
      <LobbyProvider>
        <Consumer />
      </LobbyProvider>,
    );
    emit({ event: 'lobby:join', args: ['wxyz'] });
    emit({ event: 'lobby:info', args: [sampleLobby] });

    expect(screen.getByTestId('code')).toHaveTextContent('wxyz');
    expect(screen.getByTestId('admin')).toHaveTextContent('m1');
  });

  it('captures the player id from member:id', () => {
    render(
      <LobbyProvider>
        <Consumer />
      </LobbyProvider>,
    );
    emit({ event: 'member:id', args: ['server-assigned'] });
    expect(screen.getByTestId('playerId')).toHaveTextContent('server-assigned');
  });

  it('clears lobby state on lobby:leave', () => {
    render(
      <LobbyProvider>
        <Consumer />
      </LobbyProvider>,
    );
    emit({ event: 'lobby:join', args: ['wxyz'] });
    emit({ event: 'lobby:info', args: [sampleLobby] });
    emit({ event: 'lobby:leave', args: [] });
    expect(screen.getByTestId('code')).toHaveTextContent('');
    expect(screen.getByTestId('admin')).toHaveTextContent('');
  });

  it('adds emote events and expires them after the TTL', () => {
    vi.useFakeTimers();
    render(
      <LobbyProvider>
        <Consumer />
      </LobbyProvider>,
    );
    emit({ event: 'lobby:emote', args: ['m1', 'smile'] });
    expect(screen.getByTestId('emotes')).toHaveTextContent('smile');

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByTestId('emotes')).toHaveTextContent('');
  });
});

describe('ConnectionOverlay', () => {
  const lostText = 'Lost connection to server';

  it('stays hidden before the first connect', () => {
    render(
      <LobbyProvider>
        <ConnectionOverlay />
      </LobbyProvider>,
    );
    expect(screen.queryByText(lostText)).toBeNull();
  });

  it('shows after connecting then dropping, and hides on reconnect', () => {
    h.status = 'pending';
    const { rerender } = render(
      <LobbyProvider>
        <ConnectionOverlay />
      </LobbyProvider>,
    );
    // connected -> overlay hidden
    expect(screen.queryByText(lostText)).toBeNull();

    // drop the stream
    h.status = 'connecting';
    rerender(
      <LobbyProvider>
        <ConnectionOverlay />
      </LobbyProvider>,
    );
    expect(screen.getAllByText(lostText).length).toBeGreaterThan(0);

    // reconnect
    h.status = 'pending';
    rerender(
      <LobbyProvider>
        <ConnectionOverlay />
      </LobbyProvider>,
    );
    expect(screen.queryByText(lostText)).toBeNull();
  });
});

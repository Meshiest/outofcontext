/* eslint-disable react-refresh/only-export-components -- provider + its consumer hooks are colocated
   by contract (usePreferences-style); this file is not a hot-reload boundary. */
import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { trpc } from '@/trpc/trpc';
import { getMemberId } from '@/trpc/memberId';
import {
  reduceConnection,
  initialConnectionState,
  type ConnectionState,
  type SubscriptionStatus,
} from '@/trpc/connection';
import type { LobbyInfo } from '@shared/types';

// Client build version, injected by Vite/Vitest `define`. Guarded so a missing define (some tooling)
// degrades to a harmless placeholder instead of a ReferenceError.
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';

// How long an emote animation stays on screen before it is dropped (matches the 3s CSS anim).
const EMOTE_TTL_MS = 3000;

export interface EmoteEvent {
  playerId: string;
  emote: string;
  id: string;
}

// ---- Contexts (split so a change to one slice does not re-render consumers of another) ----------

type ConnectionContextValue = ConnectionState & {
  /** Reaped for inactivity. Terminal: only a reload gets a usable session back. */
  kicked: boolean;
};
const ConnectionContext = createContext<ConnectionContextValue | null>(null);

interface LobbyInfoContextValue {
  lobbyInfo: LobbyInfo | null;
  code: string | null;
  playerId: string;
  nameOk: boolean | null;
}
const LobbyInfoContext = createContext<LobbyInfoContextValue | null>(null);

interface EmotesContextValue {
  emoteEvents: EmoteEvent[];
}
const EmotesContext = createContext<EmotesContextValue | null>(null);

let emoteSeq = 0;

export function LobbyProvider({ children }: { children: ReactNode }) {
  const [conn, setConn] = useState<ConnectionState>(initialConnectionState);
  const [seenStatus, setSeenStatus] = useState<SubscriptionStatus>('idle');
  const [lobbyInfo, setLobbyInfo] = useState<LobbyInfo | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [nameOk, setNameOk] = useState<boolean | null>(null);
  const [playerId, setPlayerId] = useState<string>(() => getMemberId());
  const [emoteEvents, setEmoteEvents] = useState<EmoteEvent[]>([]);
  const [kicked, setKicked] = useState(false);

  const reloadScheduled = useRef(false);
  const emoteTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeEmote = useCallback((id: string) => {
    setEmoteEvents((prev) => prev.filter((e) => e.id !== id));
    const timer = emoteTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      emoteTimers.current.delete(id);
    }
  }, []);

  const pushEmote = useCallback(
    (emotePlayerId: string, emote: string) => {
      const id = `emote-${++emoteSeq}`;
      setEmoteEvents((prev) => [...prev, { playerId: emotePlayerId, emote, id }]);
      const timer = setTimeout(() => removeEmote(id), EMOTE_TTL_MS);
      emoteTimers.current.set(id, timer);
    },
    [removeEmote],
  );

  const handleVersion = useCallback((serverVersion: string) => {
    if (serverVersion === APP_VERSION || reloadScheduled.current) return;
    reloadScheduled.current = true;
    console.warn('Incompatible version. Server has', serverVersion + '. I have', APP_VERSION);
    setTimeout(() => location.reload(), 2000);
  }, []);

  const handleEvent = useCallback(
    (ev: { event: string; args: unknown[] }) => {
      switch (ev.event) {
        case 'member:id':
          setPlayerId(ev.args[0] as string);
          break;
        case 'version':
          handleVersion(ev.args[0] as string);
          break;
        case 'lobby:info':
          setLobbyInfo(ev.args[0] as LobbyInfo);
          break;
        case 'lobby:join':
          setCode(ev.args[0] as string);
          break;
        case 'lobby:leave':
          setCode(null);
          setLobbyInfo(null);
          setNameOk(null);
          break;
        case 'member:nameOk':
          setNameOk(ev.args[0] as boolean);
          break;
        case 'lobby:emote':
          pushEmote(ev.args[0] as string, ev.args[1] as string);
          break;
        case 'member:kicked':
          setKicked(true);
          break;
        default:
          break;
      }
    },
    [handleVersion, pushEmote],
  );

  const subscription = trpc.lobby.onInfo.useSubscription(undefined, {
    onData: handleEvent,
  });

  // Fold the subscription status into connection state. Using React's "adjust state during render"
  // pattern (guarded setState in the render body, NOT in an effect) so the update is applied before
  // paint and converges once `seenStatus` catches up - no setState-in-effect, no ref-in-render.
  const status = subscription.status;
  if (status !== seenStatus) {
    setSeenStatus(status);
    setConn((prev) => reduceConnection(prev, status));
  }
  const { everConnected, connected, disconnected } = conn;

  useEffect(() => {
    const timers = emoteTimers.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    };
  }, []);

  const connectionValue = useMemo<ConnectionContextValue>(
    () => ({ everConnected, connected, disconnected, kicked }),
    [everConnected, connected, disconnected, kicked],
  );

  const lobbyInfoValue = useMemo<LobbyInfoContextValue>(
    () => ({ lobbyInfo, code, playerId, nameOk }),
    [lobbyInfo, code, playerId, nameOk],
  );

  const emotesValue = useMemo<EmotesContextValue>(() => ({ emoteEvents }), [emoteEvents]);

  return (
    <ConnectionContext value={connectionValue}>
      <LobbyInfoContext value={lobbyInfoValue}>
        <EmotesContext value={emotesValue}>{children}</EmotesContext>
      </LobbyInfoContext>
    </ConnectionContext>
  );
}

// ---- Consumer hooks -----------------------------------------------------------------------------

export function useConnection(): ConnectionContextValue {
  const ctx = useContext(ConnectionContext);
  if (!ctx) throw new Error('useConnection must be used within a LobbyProvider');
  return ctx;
}

export function useLobbyInfo(): LobbyInfoContextValue {
  const ctx = useContext(LobbyInfoContext);
  if (!ctx) throw new Error('useLobbyInfo must be used within a LobbyProvider');
  return ctx;
}

export function usePlayerId(): string {
  return useLobbyInfo().playerId;
}

/** Raw received emote events (auto-expiring). `useEmotes` layers sending + rate-limiting on top. */
export function useEmoteEvents(): EmoteEvent[] {
  const ctx = useContext(EmotesContext);
  if (!ctx) throw new Error('useEmoteEvents must be used within a LobbyProvider');
  return ctx.emoteEvents;
}

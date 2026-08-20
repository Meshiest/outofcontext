/* eslint-disable react-refresh/only-export-components -- GameStateProvider + useGameState are
   colocated by contract; this file is not a hot-reload boundary. */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { trpc } from '@/trpc/trpc';
import type { GameState, PlayerState } from '@shared/types';

// Hot game state, kept in its OWN context (separate from the cold lobby membership) so the frequent
// game:info / game:player:info pushes do not re-render the member list. Driven by the single
// game.onState SSE subscription.

/** The latest per-game result payload ({game}:result), keyed by event name (e.g. 'story:result'). */
export type GameResults = Record<string, unknown[]>;

/** A reaction that just landed, for the float animation. `key` makes each one its own React node. */
export interface ReactionEvent {
  index: number;
  reaction: string;
  key: string;
}

// How long a floating reaction stays mounted. Matches the CSS float animation.
const REACTION_TTL_MS = 1400;

export interface GameStateContextValue {
  gameState: GameState | null;
  playerInfo: PlayerState | null;
  results: GameResults;
  /** Reactions added in the last moment, by anyone in the lobby. */
  reactionEvents: ReactionEvent[];
}

const GameStateContext = createContext<GameStateContextValue | null>(null);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerInfo, setPlayerInfo] = useState<PlayerState | null>(null);
  const [results, setResults] = useState<GameResults>({});
  const [reactionEvents, setReactionEvents] = useState<ReactionEvent[]>([]);
  const reactionSeq = useRef(0);
  const selfIdRef = useRef<string | null>(null);

  const pushReaction = useCallback((index: number, reaction: string) => {
    const key = `reaction-${++reactionSeq.current}`;
    setReactionEvents((prev) => [...prev, { index, reaction, key }]);
    // Self-expiring: the float is transient, and nothing else would ever clear it.
    setTimeout(() => {
      setReactionEvents((prev) => prev.filter((r) => r.key !== key));
    }, REACTION_TTL_MS);
  }, []);

  const handleEvent = useCallback(
    (ev: { event: string; args: unknown[] }) => {
      if (ev.event === 'game:info') {
        const next = ev.args[0] as GameState;
        setGameState(next);
        // A new / in-progress game (isComplete falsy) invalidates any results cached from a PRIOR game.
        // Clear them so a spectator - or a re-mounting player - never sees the previous game's results
        // during the new one; they repopulate on the fresh {game}:result at completion. This provider
        // lives at App scope and is never unmounted mid-session, so nothing else clears the map.
        if (!next.isComplete) {
          setResults((prev) => (Object.keys(prev).length ? {} : prev));
        }
      } else if (ev.event === 'game:player:info') {
        const info = ev.args[0] as PlayerState;
        // Read through a ref in the handler so identifying our own events does not make this callback
        // depend on (and churn with) player state.
        selfIdRef.current = info.id;
        setPlayerInfo(info);
      } else if (ev.event === 'game:reaction') {
        const payload = ev.args[0] as
          { index?: unknown; reaction?: unknown; pid?: unknown } | undefined;
        // Skip our own echo: the presser already floated this optimistically, and replaying it here
        // would show the same reaction twice.
        const mine = typeof payload?.pid === 'string' && payload.pid === selfIdRef.current;
        if (!mine && typeof payload?.index === 'number' && typeof payload.reaction === 'string') {
          pushReaction(payload.index, payload.reaction);
        }
      } else if (ev.event.endsWith(':result')) {
        setResults((prev) => ({ ...prev, [ev.event]: ev.args }));
      }
    },
    [pushReaction],
  );

  trpc.game.onState.useSubscription(undefined, { onData: handleEvent });

  const value = useMemo<GameStateContextValue>(
    () => ({ gameState, playerInfo, results, reactionEvents }),
    [gameState, playerInfo, results, reactionEvents],
  );

  return <GameStateContext value={value}>{children}</GameStateContext>;
}

/**
 * Reactions currently floating on one chain.
 *
 * Read straight from context rather than threaded down as a prop through every game's results
 * component. Returns [] outside a provider so a card can still be rendered in isolation (stories,
 * component tests) without one.
 */
export function useReactionFloats(index: number): ReactionEvent[] {
  const ctx = useContext(GameStateContext);
  const events = ctx?.reactionEvents;
  return useMemo(() => (events ?? []).filter((r) => r.index === index), [events, index]);
}

export function useGameState(): GameStateContextValue {
  const ctx = useContext(GameStateContext);
  if (!ctx) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return ctx;
}

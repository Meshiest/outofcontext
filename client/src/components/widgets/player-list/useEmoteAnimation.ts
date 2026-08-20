import { useCallback, useEffect, useRef, useState } from 'react';

/** How long an emote stays on screen before it is removed. */
export const EMOTE_LIFETIME_MS = 3000;

export interface ActiveEmote {
  emote: string;
  /** Unique per showing; changing it remounts EmoteDisplay so a repeat replays the animation. */
  key: number;
  /** True once superseded, to snap the outgoing emote invisible. */
  exiting: boolean;
}

export interface UseEmoteAnimation {
  /** Active emote per player id. */
  emotes: Record<string, ActiveEmote>;
  /** Show `emote` over `playerId`, replacing any current one and scheduling removal after 3s. */
  showEmote: (playerId: string, emote: string) => void;
}

/**
 * Tracks the current emote per player; a repeat for the same player replaces the previous one (new
 * key -> remount -> replayed animation) and each emote is removed after 3s. All pending timers are
 * cleared on unmount.
 */
export function useEmoteAnimation(): UseEmoteAnimation {
  const [emotes, setEmotes] = useState<Record<string, ActiveEmote>>({});
  const keyRef = useRef(0);
  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const showEmote = useCallback((playerId: string, emote: string) => {
    const key = ++keyRef.current;
    setEmotes((prev) => ({ ...prev, [playerId]: { emote, key, exiting: false } }));
    const id = setTimeout(() => {
      timeoutsRef.current.delete(id);
      setEmotes((prev) => {
        // Only remove if this exact showing is still current (a newer emote keeps its own timer).
        if (prev[playerId]?.key !== key) return prev;
        const next = { ...prev };
        delete next[playerId];
        return next;
      });
    }, EMOTE_LIFETIME_MS);
    timeoutsRef.current.add(id);
  }, []);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach((id) => clearTimeout(id));
      timeouts.clear();
    };
  }, []);

  return { emotes, showEmote };
}

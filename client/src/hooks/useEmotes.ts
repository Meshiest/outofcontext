import { useCallback, useRef } from 'react';
import { trpc } from '@/trpc/trpc';
import { useEmoteEvents, type EmoteEvent } from '@/contexts/LobbyContext';

// Server enforces a 400ms emote rate limit and silently drops violators (and unknown emote names).
// Match it client-side so the UI never fires an emote the server will discard.
const EMOTE_RATE_MS = 400;

export interface UseEmotes {
  sendEmote: (emote: string) => void;
  emoteEvents: EmoteEvent[];
}

/**
 * Emote sending (rate-limited) + the received emote stream that drives the animation UI. Received
 * events come from the lobby.onInfo subscription (LobbyProvider); each carries a unique `id` for React
 * keys and auto-expires after the animation duration.
 */
export function useEmotes(): UseEmotes {
  const emoteEvents = useEmoteEvents();
  const emoteMutation = trpc.lobby.emote.useMutation();
  const lastSent = useRef(0);

  const sendEmote = useCallback(
    (emote: string) => {
      const now = Date.now();
      if (now - lastSent.current < EMOTE_RATE_MS) return;
      lastSent.current = now;
      emoteMutation.mutate(emote);
    },
    [emoteMutation],
  );

  return { sendEmote, emoteEvents };
}

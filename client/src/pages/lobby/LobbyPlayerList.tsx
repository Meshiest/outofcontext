import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import type { GameState, LobbyInfo } from '@shared/types';
import GAMES from '@gameInfo';
import { PlayerList, type PlayerListHandle } from '@/components/widgets/player-list/PlayerList';
import type { LobbyState } from '@/components/widgets/player-list/types';
import { useEmotes } from '@/hooks/useEmotes';
import { useLobby } from '@/hooks/useLobby';
import { useLobbyAdmin } from '@/hooks/useLobbyAdmin';
import { useGame } from '@/hooks/useGame';
import { canJoinPlayers } from './configUtils';

export interface LobbyPlayerListProps {
  lobbyInfo: LobbyInfo;
  playerId: string;
  /** Server lobby state ('WAITING' | 'PLAYING'), NOT the client state machine. */
  lobbyState: LobbyState;
  gameState?: GameState;
}

/**
 * Wires the presentational PlayerList to the real transport: emote send + the received emote stream
 * (fed into the list's `showEmote` handle), admin grant/remove, spectate/join/leave, replace, and end
 * game. Shared by the waiting and playing screens so this wiring lives in exactly one place.
 */
export function LobbyPlayerList({
  lobbyInfo,
  playerId,
  lobbyState,
  gameState,
}: LobbyPlayerListProps) {
  const navigate = useNavigate();
  const { sendEmote, emoteEvents } = useEmotes();
  const { spectate, replaceMember } = useLobby();
  const { grantAdmin, toggleAdmin } = useLobbyAdmin();
  const { endGame } = useGame();

  const listRef = useRef<PlayerListHandle>(null);
  const seenRef = useRef(new Set<string>());

  // Feed each newly-received emote into the list once; drop expired ids so the set does not grow.
  useEffect(() => {
    for (const ev of emoteEvents) {
      if (seenRef.current.has(ev.id)) continue;
      seenRef.current.add(ev.id);
      listRef.current?.showEmote(ev.playerId, ev.emote);
    }
    const present = new Set(emoteEvents.map((e) => e.id));
    for (const id of seenRef.current) {
      if (!present.has(id)) seenRef.current.delete(id);
    }
  }, [emoteEvents]);

  const gameMeta = GAMES[lobbyInfo.game as keyof typeof GAMES];
  const isSpectator = lobbyInfo.spectators.some((s) => s.id === playerId);

  return (
    <PlayerList
      ref={listRef}
      players={lobbyInfo.players}
      spectators={lobbyInfo.spectators}
      admin={lobbyInfo.admin}
      currentUserId={playerId}
      isSpectator={isSpectator}
      canJoinPlayers={canJoinPlayers(lobbyInfo, gameMeta)}
      lobbyState={lobbyState}
      gameState={gameState}
      onSendEmote={sendEmote}
      onGrantAdmin={grantAdmin}
      onRemovePlayer={toggleAdmin}
      onSpectate={spectate}
      onJoinPlayers={spectate}
      onReplace={replaceMember}
      onEndGame={endGame}
      onLeave={() => navigate('/')}
    />
  );
}

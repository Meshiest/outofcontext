import type { GameState, PlayerState } from '@shared/types';

/**
 * One target entry in battle-royale mode: a target player id plus the kill words the hunter must
 * trick that target into saying. Mirrors the `{ target, words }` objects built in
 * core/games/assassin.ts getPlayerState.
 */
export interface AssassinTargetEntry {
  target: string;
  words: string[];
}

/**
 * Assassin's per-player state (extends the base PlayerState). `state` is 'READING' or 'DONE' (with an
 * implicit transitional/empty fallback). Single-target mode fills `target` (a player id) + `words`;
 * battle-royale mode (see AssassinGameState.battleRoyale) fills `targets` instead. Mirrors
 * core/games/assassin.ts getPlayerState.
 */
export interface AssassinPlayerState extends PlayerState {
  title: string;
  target?: string;
  words?: string[];
  targets?: AssassinTargetEntry[];
}

/** Assassin's overall game state. `battleRoyale` selects single-target vs multi-target dossier. */
export interface AssassinGameState extends GameState {
  battleRoyale?: boolean;
}

/** A dossier target after playerId -> display-name resolution, ready to render verbatim. */
export interface ResolvedTarget {
  name: string;
  words: string[];
}

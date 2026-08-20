import type { ConfigFieldDef, GameMeta, LobbyInfo } from '@shared/types';

/** The runtime sentinel a config value can hold to mean "track the current player count". */
export const NUM_PLAYERS = '#numPlayers';

/** Default upper bound when an int field omits `max`. */
export const DEFAULT_MAX = 256;

/** Translated words the read-only stat text needs (kept out of this pure module for i18n). */
export interface ConfigTextLabels {
  yes: string;
  no: string;
  unknown: string;
}

/**
 * The effective raw value for a config field: the lobby's stored override, or the game's default
 * when the lobby has not set one. Returned untouched (still `'#numPlayers'`, a number, or an option
 * name) - resolve it with `deriveConfigValue`/`deriveConfigText`.
 */
export function configValue(
  config: Record<string, unknown>,
  cfg: ConfigFieldDef,
  name: string,
): string | number {
  const stored = config[name];
  if (stored !== undefined) return stored as string | number;
  return cfg.defaults;
}

/**
 * Resolve a raw config value to the value the control should show. Int fields resolve the
 * `'#numPlayers'` sentinel to `min(playerCount, max)`; bool and list fields pass their string value
 * through unchanged.
 */
export function deriveConfigValue(
  cfg: ConfigFieldDef,
  rawValue: string | number,
  playerCount: number,
): string | number {
  if (cfg.type === 'int') {
    if (rawValue === NUM_PLAYERS) return Math.min(playerCount, cfg.max ?? DEFAULT_MAX);
    return typeof rawValue === 'number' ? rawValue : Number(rawValue);
  }
  return String(rawValue);
}

/**
 * The human-readable text for a read-only config stat. Int -> the derived number; bool -> Yes/No;
 * list -> the matching option's `text`. The bool/unknown words are supplied translated by the caller
 * so this module stays copy-free.
 */
export function deriveConfigText(
  cfg: ConfigFieldDef,
  rawValue: string | number,
  playerCount: number,
  labels: ConfigTextLabels,
  /** Translate a list option's label by its id. Returns null when there is no entry for it. */
  translateOption?: (optionName: string) => string | null,
): string {
  switch (cfg.type) {
    case 'int':
      return String(deriveConfigValue(cfg, rawValue, playerCount));
    case 'bool':
      return rawValue === 'true' ? labels.yes : labels.no;
    case 'list': {
      const entry = cfg.options?.find((option) => option.name === rawValue);
      if (!entry) return labels.unknown;
      return translateOption?.(entry.name) ?? labels.unknown;
    }
    default:
      return labels.unknown;
  }
}

/**
 * Whether the current user (a spectator) may still take an open player slot. True when no game is
 * selected, or when the player count is below the configured max and the lobby's player count is
 * flexible.
 */
export function canJoinPlayers(lobbyInfo: LobbyInfo, gameMeta: GameMeta | undefined): boolean {
  const confPlayers = lobbyInfo.config.players;
  const maxFromGame = gameMeta ? (gameMeta.config.players?.max ?? 0) : 0;
  const confNum = typeof confPlayers === 'number' ? confPlayers : NaN;
  const maxPlayers = Math.min(maxFromGame, confNum);
  const playerCount = lobbyInfo.players.length;

  // An open place exists (NaN max -> unbounded -> always open).
  const openSpot = !maxPlayers || playerCount < maxPlayers;
  const flexible = !confPlayers || confPlayers === NUM_PLAYERS || playerCount === 0;

  return (flexible && openSpot) || !gameMeta;
}

/**
 * The Start Game button is disabled when any `'#numPlayers'` int config would resolve below its
 * minimum for the current player count (you cannot start a game short of the required players).
 */
export function invalidConfig(lobbyInfo: LobbyInfo, gameMeta: GameMeta | undefined): boolean {
  if (!gameMeta) return false;
  const numPlayers = lobbyInfo.players.length;
  for (const [key, cfg] of Object.entries(gameMeta.config)) {
    if (lobbyInfo.config[key] === NUM_PLAYERS && numPlayers < (cfg.min ?? 0)) return true;
  }
  return false;
}

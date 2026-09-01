import gameInfo from '../gameInfo.js';
import type { GameId } from '@shared/types';

/**
 * Local, first-party game metrics. Nothing here leaves the process: no beacon, no cookie, no
 * third-party script, and no identifier of any kind in an event.
 *
 * The default sink is a no-op, so every call site costs one dead method call until a real sink is
 * installed with `setMetricsSink`. Call sites are written once and never guarded.
 */

/**
 * An ISO 3166-1 alpha-2 country, from Cloudflare's `CF-IPCountry` request header.
 *
 * This is the ONLY thing derived from a visitor's IP, and the IP itself is never read or stored -
 * `CF-Connecting-IP` must stay untouched. Cloudflare also sends non-country sentinels here (`XX`
 * when it cannot resolve one, `T1` for Tor), which `parseCountry` rejects rather than recording as
 * if they were places.
 */
export type Country = string;

const COUNTRY_RE = /^[A-Z]{2}$/;
const NOT_A_COUNTRY = new Set(['XX', 'T1']);

/** Validate a `CF-IPCountry` header value, returning undefined for anything that is not a country. */
export function parseCountry(raw: string | string[] | undefined): Country | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return undefined;
  const upper = value.toUpperCase();
  if (!COUNTRY_RE.test(upper) || NOT_A_COUNTRY.has(upper)) return undefined;
  return upper;
}

/** Every game id. Exported for backends that materialise a label set rather than just test one. */
export const GAME_IDS = Object.keys(gameInfo) as GameId[];

const GAME_ID_SET = new Set<string>(GAME_IDS);

/**
 * Narrow a `Lobby.selectedGame` to a GameId. The lobby models it as a plain string that is `''`
 * before a game is picked, so events take the checked value and callers skip the metric rather than
 * recording a game that does not exist. Keys come from gameInfo, so adding a game needs no edit here.
 */
export function parseGameId(raw: string): GameId | undefined {
  return GAME_ID_SET.has(raw) ? (raw as GameId) : undefined;
}

/**
 * The settings a game was started with, split by how each can be reported.
 *
 * `choices` are the bool and list fields carrying their RAW selection - a list field stores its
 * option name (`collab`, `sec15`), a small closed set that makes a good label. `numbers` are the int
 * fields, resolved (so `#numPlayers` is the real count); those run to 256 under gameInfo's bounds,
 * so they are histogram observations rather than label values.
 */
export interface GameConfigSettings {
  choices: Array<{ setting: string; value: string }>;
  numbers: Array<{ setting: string; value: number }>;
}

export interface GameStartedEvent {
  game: GameId;
  players: number;
  /**
   * The lobby admin's country, or undefined. Exactly ONE country per game, so a counter labelled
   * with it still sums to the number of games. Per-player geography goes on `participants` instead:
   * incrementing a game counter once per distinct country present would make
   * `sum(games_started_total)` mean "games times countries", which reads as a plausible number and
   * is silently wrong.
   */
  country?: Country;
  /** One entry per player with a resolvable country. May be shorter than `players`. */
  participants: Country[];
  /** What the game was configured with. Carried on the start event so the two cannot diverge. */
  config: GameConfigSettings;
  /**
   * Whether the lobby came from the RocketCrab handoff. A boolean, so it only doubles a series
   * count, and it separates two populations that behave nothing alike: a RocketCrab lobby is
   * created empty by an external caller and joined seconds later through an iframe.
   */
  rocketcrab: boolean;
}

export type GameEndReason = 'completed' | 'ended' | 'error' | 'abandoned';

export interface GameEndedEvent {
  game: GameId;
  reason: GameEndReason;
  /** The lobby admin's country - see GameStartedEvent.country for why it is not per player. */
  country?: Country;
  durationMs: number;
  /** See GameStartedEvent.rocketcrab. */
  rocketcrab: boolean;
}

/**
 * The player states a duration can be attributed to. `other` is the catch-all: states come from each
 * game's getPlayerState(), which returns a plain string, so an unrecognised one must land in a
 * bounded bucket rather than minting a new label value.
 */
export const PLAYER_STATES = ['editing', 'waiting', 'reading', 'done', 'other'] as const;
export type PlayerStateName = (typeof PLAYER_STATES)[number];

const KNOWN_STATES = new Set<string>(['editing', 'waiting', 'reading', 'done']);

export function parsePlayerState(raw: string): PlayerStateName {
  const lower = raw.toLowerCase();
  return KNOWN_STATES.has(lower) ? (lower as PlayerStateName) : 'other';
}

/**
 * A player left a state, having been in it for `durationMs`.
 *
 * `state` is the state that ENDED, which is the one the duration measures - so `waiting` is time
 * spent waiting for a turn to arrive and `editing` is time spent taking it. Keying on the state
 * that ended rather than the one entered is what makes `reading` measurable at all, and stops an
 * EDITING -> READING transition being recorded as a turn made of reading time.
 */
export interface PlayerStateEndedEvent {
  game: GameId;
  state: PlayerStateName;
  durationMs: number;
  country?: Country;
  /** See GameStartedEvent.rocketcrab. */
  rocketcrab: boolean;
}

export interface EmoteEvent {
  emote: string;
  /**
   * The lobby's SELECTED game, which is set as soon as someone picks one - so this covers emotes
   * sent while still waiting in the lobby, not only mid-game. Undefined before any game is picked.
   */
  game?: GameId;
  country?: Country;
  /** See GameStartedEvent.rocketcrab. */
  rocketcrab: boolean;
}

/**
 * A player added a reaction to a finished chain. Only ADDS are reported: toggling one off is not a
 * reaction being used, and counting both would make the total mean "reaction presses".
 */
export interface ReactionAddedEvent {
  reaction: string;
  game: GameId;
  rocketcrab: boolean;
}

export interface EmoteRateLimitedEvent {
  game?: GameId;
  /** See GameStartedEvent.rocketcrab. */
  rocketcrab: boolean;
}

/**
 * A client contacted the server with a member id it had not used before - the closest thing to a
 * "visit" this app can report without tracking anyone. It needs no cookie, no IP, and no hash: the
 * id is a per-tab sessionStorage UUID the client already mints so a player keeps their seat across
 * reconnects, and this only counts the first time one is seen.
 *
 * It counts SESSIONS, not people. Three tabs is three. Someone idle long enough to be reaped who
 * then returns counts again, which is the right answer for a visit anyway.
 */
export interface SessionStartedEvent {
  country?: Country;
}

export interface TrpcRequestEvent {
  /** Dotted procedure path, e.g. `lobby.join`. A closed set from the router, so safe as a label. */
  procedure: string;
  outcome: 'ok' | 'error';
  type: 'query' | 'mutation' | 'subscription';
  /**
   * Handler time. Meaningless for a subscription, which lives as long as the SSE stream does - the
   * Prometheus sink uses `type` to keep those out of the latency histogram while still counting them.
   */
  durationMs: number;
}

export interface AppErrorEvent {
  /** An AppErrorCode. Closed set of 7. */
  code: string;
}

/**
 * Every metric the app reports. Implementations decide which fields become labels - the events
 * carry more than the Prometheus sink uses on purpose, because label cardinality is a decision
 * about the STORAGE backend, not about the event. `country` on the player-state event is the case
 * in point: the Prometheus sink deliberately drops it, since that is a histogram and a histogram
 * already costs bucket+sum+count series for every label combination.
 */
export interface MetricsSink {
  sessionStarted(event: SessionStartedEvent): void;
  gameStarted(event: GameStartedEvent): void;
  gameEnded(event: GameEndedEvent): void;
  playerStateEnded(event: PlayerStateEndedEvent): void;
  emoteSent(event: EmoteEvent): void;
  reactionAdded(event: ReactionAddedEvent): void;
  emoteRateLimited(event: EmoteRateLimitedEvent): void;
  trpcRequest(event: TrpcRequestEvent): void;
  appError(event: AppErrorEvent): void;
}

/** Discards everything. The default, and what tests get unless they install their own. */
export const NOOP_METRICS: MetricsSink = {
  sessionStarted() {},
  gameStarted() {},
  gameEnded() {},
  playerStateEnded() {},
  emoteSent() {},
  reactionAdded() {},
  emoteRateLimited() {},
  trpcRequest() {},
  appError() {},
};

let sink: MetricsSink = NOOP_METRICS;

/** Install a sink, or pass null to go back to discarding. Returns the sink being replaced. */
export function setMetricsSink(next: MetricsSink | null): MetricsSink {
  const previous = sink;
  sink = next ?? NOOP_METRICS;
  return previous;
}

export function getMetricsSink(): MetricsSink {
  return sink;
}

/**
 * What call sites import. It forwards to the current sink on every call rather than capturing it,
 * so `setMetricsSink` takes effect immediately and no module needs re-importing.
 */
export const metrics: MetricsSink = {
  sessionStarted: (event) => sink.sessionStarted(event),
  gameStarted: (event) => sink.gameStarted(event),
  gameEnded: (event) => sink.gameEnded(event),
  playerStateEnded: (event) => sink.playerStateEnded(event),
  emoteSent: (event) => sink.emoteSent(event),
  reactionAdded: (event) => sink.reactionAdded(event),
  emoteRateLimited: (event) => sink.emoteRateLimited(event),
  trpcRequest: (event) => sink.trpcRequest(event),
  appError: (event) => sink.appError(event),
};

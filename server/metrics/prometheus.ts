import { Registry, Counter, Gauge, Histogram, collectDefaultMetrics } from 'prom-client';
import { GAME_IDS, PLAYER_STATES, type MetricsSink } from '../../core/Metrics.js';
import { computeServerInfo } from '../stats.js';
import { Member } from '../../core/Member.js';
import * as Persistence from '../../core/Persistence.js';
import { VERSION } from '../version.js';

/**
 * The Prometheus implementation of MetricsSink.
 *
 * Label discipline is the whole job here. A label value creates a time series that lives forever in
 * the scraper, so only CLOSED sets are allowed: game (6), emote (16), reason (4), outcome (2), code
 * (7), country (~200). A lobby code or member id must never reach a label - a 4-char code has 1.6M
 * possible values, and a member id is both unbounded and an identifier.
 *
 * Histograms get no country label. A histogram already costs bucket+sum+count series per label
 * combination, so multiplying that by ~200 countries buys a lot of series for a question nobody is
 * asking.
 */

/**
 * Player state durations in SECONDS. The long tail is the interesting part - a four minute wait says
 * something a four second one does not - so the buckets run well past a typical turn.
 */
const DURATION_BUCKETS = [1, 2.5, 5, 10, 20, 30, 60, 120, 300, 600];

/** Game durations in SECONDS: a chain game runs minutes to the better part of an hour. */
const GAME_DURATION_BUCKETS = [30, 60, 120, 300, 600, 1200, 1800, 3600];

/**
 * Numeric game settings - chain lengths, story counts. gameInfo bounds them at 256, so the buckets
 * cover a hobby-sized board closely and the long tail coarsely.
 */
const CONFIG_VALUE_BUCKETS = [1, 2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 50, 100, 256];

/** tRPC handler time in SECONDS. Everything is in-memory, so anything past 100ms is notable. */
const REQUEST_BUCKETS = [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 1, 5];

/** Label value for an unresolved country, so the series exists rather than silently vanishing. */
const UNKNOWN_COUNTRY = 'unknown';

/** Label value for a lobby with no game picked yet. Keeps `game` present on every emote sample. */
const NO_GAME = 'none';

/** Prometheus labels are strings, so a boolean has to be spelled out. */
const flag = (value: boolean): string => (value ? 'true' : 'false');

const ROCKETCRAB_FLAGS = [flag(false), flag(true)];

export interface PrometheusMetrics {
  sink: MetricsSink;
  registry: Registry;
}

export function createPrometheusMetrics(): PrometheusMetrics {
  const registry = new Registry();

  // Process CPU, RSS, heap, GC, handles, and event loop lag. On a single-core box running a
  // realtime SSE game, nodejs_eventloop_lag_seconds is the number that says players are feeling it.
  collectDefaultMetrics({ register: registry });

  // The conventional way to expose a build: a gauge fixed at 1 whose labels carry the detail, so
  // the version is queryable without becoming a label on every other metric.
  new Gauge({
    name: 'ooc_build_info',
    help: 'Always 1. The version label carries the running build.',
    labelNames: ['version'],
    registers: [registry],
  }).set({ version: VERSION }, 1);

  const sessions = new Counter({
    name: 'ooc_sessions_total',
    help: 'First contact from a member id, i.e. a visit. Counts sessions, not people.',
    labelNames: ['country'],
    registers: [registry],
  });

  const gamesStarted = new Counter({
    name: 'ooc_games_started_total',
    help: 'Games started. Country is the lobby admin, so this sums to the number of games.',
    labelNames: ['game', 'country', 'rocketcrab'],
    registers: [registry],
  });

  const gamesEnded = new Counter({
    name: 'ooc_games_ended_total',
    help: 'Games ended, by how they ended. Country is the lobby admin.',
    labelNames: ['game', 'reason', 'country', 'rocketcrab'],
    registers: [registry],
  });

  const participants = new Counter({
    name: 'ooc_game_participants_total',
    help: 'Players per game start, by country. Sums to players, NOT to games.',
    labelNames: ['game', 'country', 'rocketcrab'],
    registers: [registry],
  });

  const gamePlayers = new Histogram({
    name: 'ooc_game_players',
    help: 'Player count at game start.',
    labelNames: ['game', 'rocketcrab'],
    buckets: [2, 3, 4, 5, 6, 8, 10, 16, 32],
    registers: [registry],
  });

  const gameDuration = new Histogram({
    name: 'ooc_game_duration_seconds',
    help: 'Wall time from game start to game end.',
    labelNames: ['game', 'rocketcrab'],
    buckets: GAME_DURATION_BUCKETS,
    registers: [registry],
  });

  const stateDuration = new Histogram({
    name: 'ooc_player_state_duration_seconds',
    help: 'Time a player spent in a state, labelled with the state that ENDED.',
    labelNames: ['game', 'state', 'rocketcrab'],
    buckets: DURATION_BUCKETS,
    registers: [registry],
  });

  const emotesSent = new Counter({
    name: 'ooc_emotes_sent_total',
    help: 'Emotes that passed the rate gate and were broadcast.',
    labelNames: ['emote', 'game', 'country', 'rocketcrab'],
    registers: [registry],
  });

  const reactions = new Counter({
    name: 'ooc_reactions_total',
    help: 'Reactions added to a finished chain. Adds only, not toggles off.',
    labelNames: ['reaction', 'game', 'rocketcrab'],
    registers: [registry],
  });

  const gameConfig = new Counter({
    name: 'ooc_game_config_total',
    help: 'Games started with each bool/list setting. Sums to games TIMES settings, not to games.',
    labelNames: ['game', 'setting', 'value'],
    registers: [registry],
  });

  const gameConfigValue = new Histogram({
    name: 'ooc_game_config_value',
    help: 'Numeric game settings at start, by setting.',
    labelNames: ['game', 'setting'],
    buckets: CONFIG_VALUE_BUCKETS,
    registers: [registry],
  });

  const emotesRateLimited = new Counter({
    name: 'ooc_emotes_rate_limited_total',
    help: 'Emotes rejected by the 400ms rate gate.',
    labelNames: ['game', 'rocketcrab'],
    registers: [registry],
  });

  const trpcRequests = new Counter({
    name: 'ooc_trpc_requests_total',
    help: 'tRPC calls by procedure and outcome.',
    labelNames: ['procedure', 'outcome'],
    registers: [registry],
  });

  const trpcDuration = new Histogram({
    name: 'ooc_trpc_duration_seconds',
    help: 'tRPC handler duration.',
    labelNames: ['procedure'],
    buckets: REQUEST_BUCKETS,
    registers: [registry],
  });

  const appErrors = new Counter({
    name: 'ooc_app_errors_total',
    help: 'Errors returned to clients, by AppErrorCode.',
    labelNames: ['code'],
    registers: [registry],
  });

  // Live counts are already derived by walking the lobby list in computeServerInfo(). Collecting
  // them at SCRAPE time reuses that single source rather than maintaining a parallel counting path
  // that could drift from it.
  new Gauge({
    name: 'ooc_games_active',
    help: 'Games currently in progress.',
    labelNames: ['game'],
    registers: [registry],
    collect() {
      const info = computeServerInfo();
      // Rebuild the whole set. A game that drops to zero must report zero rather than its last
      // value, and one nobody is playing must be a zero rather than a missing series.
      this.reset();
      for (const game of GAME_IDS) this.set({ game }, 0);
      for (const [game, count] of Object.entries(info.gameDistribution)) {
        this.set({ game }, count);
      }
    },
  });

  new Gauge({
    name: 'ooc_lobbies_active',
    help: 'Lobbies by state. idle means fewer than two members.',
    labelNames: ['state'],
    registers: [registry],
    collect() {
      const info = computeServerInfo();
      this.set({ state: 'idle' }, info.idleLobbies);
      this.set({ state: 'waiting' }, info.lobbies);
      this.set({ state: 'playing' }, info.games);
    },
  });

  new Gauge({
    name: 'ooc_lobby_members',
    help: 'People currently in lobbies, by lobby state.',
    labelNames: ['state'],
    registers: [registry],
    collect() {
      const info = computeServerInfo();
      this.set({ state: 'idle' }, info.idlePlayers);
      this.set({ state: 'waiting' }, info.lobbyPlayers);
      this.set({ state: 'playing' }, info.players);
    },
  });

  new Gauge({
    name: 'ooc_players_active',
    help: 'People currently in a running game, by game. Not the same as ooc_game_players, which is player count at start.',
    labelNames: ['game'],
    registers: [registry],
    collect() {
      const info = computeServerInfo();
      // Same rebuild as ooc_games_active: no stale values, no missing games.
      this.reset();
      for (const game of GAME_IDS) this.set({ game }, 0);
      for (const [game, count] of Object.entries(info.playerDistribution)) {
        this.set({ game }, count);
      }
    },
  });

  new Gauge({
    name: 'ooc_rocketcrab_lobbies',
    help: 'Active lobbies that came from the RocketCrab handoff.',
    registers: [registry],
    collect() {
      this.set(computeServerInfo().rocketcrabs);
    },
  });

  new Gauge({
    name: 'ooc_lobby_saves',
    help: 'Lobby saves on disk.',
    registers: [registry],
    collect() {
      this.set(Persistence.countSaves());
    },
  });

  new Gauge({
    name: 'ooc_members',
    help: 'Members in the registry.',
    registers: [registry],
    collect() {
      this.set(Member.count());
    },
  });

  new Gauge({
    name: 'ooc_members_connected',
    help: 'Members with an open SSE stream.',
    registers: [registry],
    collect() {
      this.set(Member.connectedCount());
    },
  });

  // An unlabelled counter is absent from a scrape until its first event, and rate() over an absent
  // series returns nothing rather than zero. Initialising it makes "no emotes were dropped" a
  // reportable fact instead of a gap.
  emotesRateLimited.inc({ game: NO_GAME, rocketcrab: flag(false) }, 0);

  // Same for the histograms: an unplayed game has no series at all. Zero the closed grid.
  // Not country (~200 wide) or trpc latency, which stays absent until a procedure is timed.
  for (const game of GAME_IDS) {
    for (const rocketcrab of ROCKETCRAB_FLAGS) {
      gamePlayers.zero({ game, rocketcrab });
      gameDuration.zero({ game, rocketcrab });
      for (const state of PLAYER_STATES) stateDuration.zero({ game, state, rocketcrab });
    }
  }

  const sink: MetricsSink = {
    sessionStarted({ country }) {
      sessions.inc({ country: country ?? UNKNOWN_COUNTRY });
    },
    gameStarted({ game, players, country, participants: countries, rocketcrab, config }) {
      const rc = flag(rocketcrab);
      gamesStarted.inc({ game, country: country ?? UNKNOWN_COUNTRY, rocketcrab: rc });
      gamePlayers.observe({ game, rocketcrab: rc }, players);
      for (const c of countries) participants.inc({ game, country: c, rocketcrab: rc });
      // No rocketcrab label, unlike the rest of the game-scoped set: a RocketCrab lobby's settings
      // are the external caller's presets, not a player's choice, and the split doubles all of this.
      for (const { setting, value } of config.choices) {
        gameConfig.inc({ game, setting, value });
      }
      for (const { setting, value } of config.numbers) {
        gameConfigValue.observe({ game, setting }, value);
      }
    },
    gameEnded({ game, reason, country, durationMs, rocketcrab }) {
      const rc = flag(rocketcrab);
      gamesEnded.inc({ game, reason, country: country ?? UNKNOWN_COUNTRY, rocketcrab: rc });
      gameDuration.observe({ game, rocketcrab: rc }, durationMs / 1000);
    },
    playerStateEnded({ game, state, durationMs, rocketcrab }) {
      stateDuration.observe({ game, state, rocketcrab: flag(rocketcrab) }, durationMs / 1000);
    },
    emoteSent({ emote, game, country, rocketcrab }) {
      emotesSent.inc({
        emote,
        game: game ?? NO_GAME,
        country: country ?? UNKNOWN_COUNTRY,
        rocketcrab: flag(rocketcrab),
      });
    },
    reactionAdded({ reaction, game, rocketcrab }) {
      reactions.inc({ reaction, game, rocketcrab: flag(rocketcrab) });
    },
    emoteRateLimited({ game, rocketcrab }) {
      emotesRateLimited.inc({ game: game ?? NO_GAME, rocketcrab: flag(rocketcrab) });
    },
    trpcRequest({ procedure, outcome, type, durationMs }) {
      trpcRequests.inc({ procedure, outcome });
      // A subscription's "duration" is how long the SSE stream stayed open, which would swamp the
      // handler latencies this histogram exists to show. `type` is not a label: the procedure name
      // already implies it, so making it one would only split every series in half.
      if (type !== 'subscription') trpcDuration.observe({ procedure }, durationMs / 1000);
    },
    appError({ code }) {
      appErrors.inc({ code });
    },
  };

  return { sink, registry };
}

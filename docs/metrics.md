# Metrics

No third-party analytics, no cookies, no client-side beacon, no tracking script of any kind. Every
number here is produced by the server watching things it already had to watch.

Measuring in the browser would also be worse, not just less private: a game start is one event the
server decides, but every player would report its own copy of it.

The only thing derived from a visitor is an ISO country from Cloudflare's `CF-IPCountry` header.
`CF-Connecting-IP` is never read, and no IP is stored anywhere.

## Shape

`core/Metrics.ts` defines a transport-agnostic `MetricsSink` and the event types. The default
implementation discards everything, so call sites are unguarded and cost one dead method call until
a sink is installed with `setMetricsSink()`.

Events deliberately carry more than any one backend uses. Label cardinality is a decision about the
*storage*, not about the event - `country` on the turn and wait events is the case in point: the
Prometheus sink drops it, because those are histograms.

`server/metrics/prometheus.ts` is the only implementation today.

## Exposing it

Two independent ways, both opt-in. With neither env var set the sink stays the no-op and **no
endpoint is registered at all** - not an open one, not a 401 one.

| Env | Endpoint | Use it when |
|---|---|---|
| `METRICS_PORT` (+ `METRICS_HOST`) | `/metrics` on its own listener | An agent scrapes from this box |
| `METRICS_TOKEN` | `GET /metrics` on the app port, bearer-gated | Something off-box scrapes you |

The **separate listener** binds `127.0.0.1` unless `METRICS_HOST` says otherwise, so it is private
by default with no secret to leak; exposing it off-box is a deliberate act. An unparseable or
out-of-range port refuses to listen rather than guessing one.

The **token route** rides the port nginx and Cloudflare already front, so nothing new has to be
opened. Scrape with `Authorization: Bearer <token>` (`bearer_token` in a Prometheus
`scrape_config`); generate one with `openssl rand -hex 32`. It fails closed in both directions: an
absent token means the route does not exist, and a token under 16 characters is refused at boot
rather than quietly accepted. Comparison is against fixed-length SHA-256 digests via
`timingSafeEqual`, so neither the token nor its length leaks through response timing, and a missing
token is answered identically to a wrong one. Responses are `cache-control: no-store`, because a
proxy caching a scrape would serve stale counters and make `rate()` lie.

## Reference

### Counters

| Metric | Labels |
|---|---|
| `ooc_sessions_total` | `country` |
| `ooc_games_started_total` | `game`, `country`, `rocketcrab` |
| `ooc_games_ended_total` | `game`, `reason`, `country`, `rocketcrab` |
| `ooc_game_participants_total` | `game`, `country`, `rocketcrab` |
| `ooc_emotes_sent_total` | `emote`, `game`, `country`, `rocketcrab` |
| `ooc_emotes_rate_limited_total` | `game`, `rocketcrab` |
| `ooc_reactions_total` | `reaction`, `game`, `rocketcrab` |
| `ooc_game_config_total` | `game`, `setting`, `value` |
| `ooc_trpc_requests_total` | `procedure`, `outcome` |
| `ooc_app_errors_total` | `code` |

`reason` is `completed` (the game finished), `ended` (an admin stopped it), `error` (it threw), or
`abandoned` (everyone left and the lobby was culled mid-game).

### Histograms

| Metric | Labels |
|---|---|
| `ooc_game_players` | `game`, `rocketcrab` |
| `ooc_game_duration_seconds` | `game`, `rocketcrab` |
| `ooc_player_state_duration_seconds` | `game`, `state`, `rocketcrab` |
| `ooc_game_config_value` | `game`, `setting` |
| `ooc_trpc_duration_seconds` | `procedure` |

`state` is the state that **ended** - the one the duration measures. `waiting` is time spent waiting
for a turn to arrive, `editing` is time spent taking it, `reading` is time spent on results. Keying
on the state that ended rather than the one entered is what makes `reading` measurable at all, and
stops an EDITING to READING transition being recorded as a turn made of reading time.

States come from each game's `getPlayerState()`, which returns a plain string, so an unrecognised
one is bucketed as `other` rather than minting a new label value.

A subscription is counted in `ooc_trpc_requests_total` but kept out of `ooc_trpc_duration_seconds`:
its duration is how long the SSE stream stayed open, which would swamp the handler latencies the
histogram exists to show.

### Gauges

| Metric | Labels |
|---|---|
| `ooc_build_info` (always 1) | `version` |
| `ooc_lobbies_active` | `state` |
| `ooc_lobby_members` | `state` |
| `ooc_games_active` | `game` |
| `ooc_players_active` | `game` |
| `ooc_rocketcrab_lobbies` | - |
| `ooc_lobby_saves` | - |
| `ooc_members` | - |
| `ooc_members_connected` | - |

Plus everything `collectDefaultMetrics` supplies: process CPU, RSS, heap, GC, handles, and
`nodejs_eventloop_lag_seconds`. On a single-core box running a realtime SSE game, that last one is
the number that says players are feeling it.

## Counting visits without tracking anyone

`ooc_sessions_total` is incremented on first contact from a member id.

`oocMemberId` is a `sessionStorage` UUID the client already mints so a player keeps their seat
across reconnects. It is per-tab and dies when the tab closes, which makes it almost exactly a
classic "visit" - and unlike the rotating-salt IP hash that Plausible and GoatCounter use for the
same purpose, it needs no IP, no salt, and no hash. The server counts the first time it sees one and
never again.

Two honest caveats. It counts **sessions, not people**: three tabs is three, and tomorrow is
another. And someone idle long enough to be reaped who then returns counts again, which is arguably
the right answer for a visit anyway.

A request that sends no id at all is not counted. That also mints a `Member`, but it is a bare probe
of `/trpc` rather than a browser running the app, and counting it would inflate visits with scanner
traffic.

## Label discipline

A label value creates a time series that lives forever in the scraper, so only closed sets are
allowed: `game` (6), `emote` (16), `reason` (4), `outcome` (2), `code` (7), `rocketcrab` (2),
`country` (~200), `state` (5).

**A lobby code or member id must NEVER become a label.** A 4-char code has 1.6M possible values, and
a member id is both unbounded and an identifier.

Histograms carry no `country`. A histogram already costs bucket+sum+count series per label
combination, so multiplying that by ~200 buys a lot of series for a question nobody is asking.

Game counters take the **lobby admin's** country, so `sum(ooc_games_started_total)` is the number of
games. Incrementing once per distinct country present would make that sum mean "games times
countries", which reads as a plausible number and is silently wrong. Per-player geography lives on
`ooc_game_participants_total`, which sums to players rather than games.

`rocketcrab` is on every game-scoped metric because a RocketCrab lobby is a different population: it
is created empty by an external caller and joined seconds later through an iframe, so mixing it with
direct play muddies both.

`ooc_reactions_total` counts **adds only**. Toggling a reaction off is not a reaction being used,
and counting both would make the total mean "reaction presses". Reactions are also only accepted
once every chain is finished, so the count is of reactions to results, never mid-game.

`ooc_emotes_sent_total` is the widest metric in the set. If a scrape ever gets slow, look there
first.

## Game settings

Two metrics, split by what a setting can safely become.

**Choices** - the bool and list fields - become labels on `ooc_game_config_total`, carrying the raw
selection: `true`/`false`, or a list field's option NAME (`collab`, `sec15`, `three`). Small closed
sets. Note it is incremented once per setting per game, so `sum(ooc_game_config_total)` is games
TIMES settings, not games; filter to a single `setting` to get a game count.

**Numbers** - the int fields - become observations on the `ooc_game_config_value` histogram. They
are bounded at 256 by gameInfo, so as label values they would be up to 256 series per setting per
game. A histogram is the right tool for a numeric and cannot blow up.

Numbers are reported RESOLVED, so a field defaulting to `#numPlayers` reports the real count rather
than the sentinel. Choices are read from the raw `gameConfig` instead, because that is the only
place a list field's option name survives - `configVals()` has already replaced it with the option's
value, which for a gamemode is a whole object.

`players` is deliberately absent: `ooc_game_players` already reports exactly that number.

Neither config metric carries `rocketcrab`, unlike the rest of the game-scoped set. A RocketCrab
lobby is preset by the external caller, so its settings are RocketCrab's defaults rather than a
player's choice. The split would double these 217 series to 434 - the histogram alone is 170 of
them, at 17 series per numeric setting - to answer a question about RocketCrab rather than the games.

## Restarts

**Counters reset when the process restarts, and when the container rebuilds.** That is normal.
`rate()` and `increase()` detect counter resets and compensate, and `process_start_time_seconds` is
in every scrape so a scraper can see the restart.

The scraper is the database. The app only ever reports current values, so history survives restarts
only once something is actually scraping - until then `/metrics` is a live readout, not a record.
Anything between the last scrape and a restart is lost for good, which at a 15-60s interval is
seconds of data.

Do **not** persist counters to disk to work around this. Restoring a counter across restarts breaks
exactly the reset detection the model depends on.

## Live gauges

The gauges are not accumulated as things happen - they are computed at SCRAPE time from
`computeServerInfo()`, the same walk of the lobby list that backs the `server.info` tRPC procedure.
(`/metrics` is the only HTTP surface for these now; the old `/api/v1/info` shim is gone, and
`/api/v1/ok` is a bare liveness probe that reports nothing.)
Deriving them rather than maintaining a parallel counting path means the two cannot drift.

Counts come in pairs, containers and people, and you want both: `ooc_lobbies_active{state="playing"}`
says three games are running, and `ooc_lobby_members{state="playing"}` says whether that is six
players or sixty. A test pins that every one of these series is present in a scrape.

`ooc_members` counts the whole registry including disconnected members, where
`ooc_members_connected` counts only those with an open stream. The gap between them is the reconnect
grace window.

`ooc_lobby_saves` reads the persistence directory each scrape rather than tracking a counter. The
store is written by shutdown handlers and culled by cron as well as by normal play, so a counter
would drift on the first path that missed an increment. No filesystem can report a file count
without enumerating, and `readdirSync` measured fastest of the options: 0.27ms for 1k saves, 2.9ms
for 10k, against a scrape interval of tens of seconds.

# Out Of Context Party Games

Online multiplayer party game platform at [outofcontext.party](https://www.outofcontext.party).
Players join lobbies via 4-character codes and play collaborative/social games in real time.

**Stack:** React 19 + Tailwind v4 + Vite in `client/`, TypeScript Express + tRPC on the backend,
Node 22. The realtime transport is a typed **tRPC** contract: mutations/queries over HTTP,
server->client push over **SSE**. Everything is TypeScript - there is no JavaScript left in the app.

The Vue 2 / Semantic UI / Socket.IO / webpack app this replaced is gone, along with the document that
described it. If you find a doc or comment presenting any of that as current, it is stale - fix it or
delete it. The behaviours worth keeping from the old code now live as comments beside the code that
kept them (see `Random.gauss` and `LobbyPlayer.id`); anything else is in the git history.

The rewrite plan that produced this codebase is finished, so it and its phase documents were
deleted. They are in the git history if you ever need them.

Remaining planned work: **horizontal scale** is designed but not enabled - one instance runs the
whole app today. The intended shape, since this note is now the only record of it: partition by
lobby, each owned by one instance and routed by its code; Redis holds the lobby->instance registry
plus pub/sub for cross-instance stats and failover; the existing pako+JSON persistence becomes the
failover substrate. No tRPC procedure signature changes - only where a lobby lives and how a client
finds it. `REDIS_URL` in `.env.example` is the switch, unused today.

## Hard rules

- **No decorative unicode.** The rule targets typographic garnish, not letters: no emoji, no em/en
  dashes, no arrows, no ellipsis character, no curly quotes, no box-drawing. Write `->` / `<->`, `-`,
  `...`, and build diagrams from `- | +`. This applies in code, comments, docs, and commit messages.
  **Words are exempt.** A word in another language keeps its correct spelling wherever it appears,
  including in commit messages and docs - German umlauts and eszett, Spanish tildes and inverted
  punctuation, French accents and cedillas. Do not transliterate `Woerder` for `Wörder`: a
  misspelling is worse than the character it avoids. Two further deliberate exceptions live in data:
  the em dash in an authorship credit, and Redacted's block-character subtitle.
- **All copy is translated.** No hardcoded user-facing strings. Every UI string lives in a locale
  file rendered via `t()`; the server returns `AppErrorCode` values, never prose.
- **Plans are checklists.** When working from a plan document, flip each `- [ ]` to `- [x]`
  immediately after completing AND verifying it, and skip items already checked. Partition work by
  whole milestone so parallel agents do not collide.

## Architecture

```
React + Tailwind + tRPC client
    <-> tRPC over HTTP (mutations/queries) + SSE (server push)
Express + tRPC router (port 8080, single instance today)
    -> Lobby -> Game instances
    -> Persistence (JSON + pako, local disk) + Drawings (content-addressed blobs)
```

Planned for scale: N instances partitioned by lobby code, with a Redis lobby->instance registry and
persistence as the failover substrate.

## Project Structure

```
main.ts                  # Express entry: tRPC mount, REST, static, cron
gameInfo.ts              # Game SHAPE only - config fields, types, bounds, option ids. No copy.
core/                    # Game engine, transport-agnostic
  Lobby.ts               # Lobby lifecycle, members, config, game selection
  Member.ts              # Member registry, SSE stream tracking, inactivity culling
  Persistence.ts         # Save/load lobby state (JSON + pako)
  Drawings.ts            # Content-addressed drawing blobs on disk + LRU cache
  games/
    game.ts              # Abstract base class
    story.ts             # Raconteur - chain-based collaborative writing
    comic.ts             # Dilettante - drawing chains (extends Story)
    draw.ts              # Scribble - draw/describe telephone (extends Story)
    redacted.ts          # Redacted - write/tamper/repair (extends Story)
    recipe.ts            # Hodgepodge - recipe creation (extends Story)
    assassin.ts          # Wurderer - word assassination setup
    util/                # Chain, Random, Sanitize, wordLists, reactions
    dicts/               # Word lists (en/de/es/fr) + animals, colors
server/                  # HTTP/transport layer
  trpc/router.ts         # Root router
  trpc/routers/          # lobby, game, member, rocketcrab, serverInfo
  trpc/context.ts        # Member resolution per request
  trpc/trpc.ts           # publicProcedure / adminProcedure
shared/                  # Types shared by client and server
  types.ts               # LobbyInfo, GameMeta, ConfigFieldDef, GameId
  events.ts              # SERVER_EVENT_NAMES, GAME_MESSAGE_TYPES
  errors.ts              # AppErrorCode
  drawing.ts             # Canvas size, MIME, byte caps, image sniffing
client/src/
  pages/                 # Home, GameList, NotFound, JoinLobbyModal, lobby/, game-list/
  games/                 # GameRenderer + one directory per game + shared/
  components/ui/         # 25 Tailwind primitives (Button, Select, Table, ...)
  components/widgets/    # SettingsPanel, Timer, PageWrapper, doodle/, player-list/
  contexts/              # LobbyContext, GameStateContext, PreferencesContext
  hooks/                 # useLobby, useGame, useTurnSound, usePreferences, ...
  trpc/                  # Client, links, connection state, member id
  i18n/                  # Setup, resources, languages, pseudo-locale
  locales/<lang>/        # en, de, es, fr - all user-facing copy
test/                    # Backend integration tests (vitest, node)
e2e/                     # Playwright flows + per-game specs
```

## Key Concepts

- **Lobby:** 4-char code, members (players + spectators), one admin, one selected game, config
  values. States: WAITING <-> PLAYING.
- **Game base class:** `start()`, `stop()`, `handleMessage(pid, type, data)`, `getState()`,
  `getPlayerState(pid)`, `save()`/`restore()`, `onPlayersChanged()`.
- **Game inheritance:** Story is the base for Comic, Draw, Redacted, Recipe. Assassin is standalone.
- **Chain:** the core data structure - a sequence of links edited by rotating players.
- **Player states:** typically cycle EDITING -> WAITING -> READING.
- **Copy vs shape:** `gameInfo.ts` defines which config fields exist and their bounds; every string
  comes from `client/src/locales/en/game-<id>.json`, keyed by the ids in gameInfo. A coverage test
  fails when one is missing.
- **Client state:** React context, not Redux. `LobbyContext` (connection + lobby info + emotes),
  `GameStateContext`, `PreferencesContext` (localStorage-backed). i18next owns the language.
- **Member identity:** the client sends a stable id (`oocMemberId`); a member survives brief SSE
  reconnects and is reaped only after a grace window.

## 6 Games

| Key | Title | Type | Players |
|-----|-------|------|---------|
| story | Raconteur | Write story lines with limited context | 2-256 |
| comic | Dilettante | Drawing/caption chains | 2-256 |
| draw | Scribble | Draw<->describe telephone | 2-256 |
| redacted | Redacted | Write -> tamper -> repair cycle | 4-256 |
| recipe | Hodgepodge | Collaborative recipe with ITEM placeholders | 2-256 |
| assassin | Wurderer | Word assassination (in-person, web setup only) | 2-256 |

## tRPC Procedures

**lobby:** `exists`, `create`, `join`, `leave`, `spectate`, `replace`, `emote` (rate-limited),
`setGame`*, `setConfig`*, `toggleAdmin`*, `grantAdmin`*, `onInfo` (subscription)
**game:** `start`*, `end`*, `message`, `onState` (subscription)
**member:** `setName` | **rocketcrab:** `create` | **serverInfo:** `info`, `version`

`*` = `adminProcedure`, which enforces the admin check in one place.

**Server->client events** (`SERVER_EVENT_NAMES` in `shared/events.ts`, pushed over SSE):
`member:id`, `member:nameOk`, `member:kicked`, `version`, `lobby:join`, `lobby:leave`, `lobby:info`,
`lobby:emote`, `game:info`, `game:player:info`, `game:reaction`, and `{game}:result` for
story/comic/draw/redacted/recipe (assassin has no results phase).

## REST API

- `GET /api/v1/lobby/:code` - does this lobby exist
- `GET /api/v1/info` - server stats
- `GET /api/v1/drawing/:id` - drawing bytes (immutable, long-cached)
- `POST /api/v1/drawing` - upload a drawing, returns its id (member must be in a lobby)
- `POST /api/v1/rocketcrab` - RocketCrab integration

Drawings travel as ids over SSE and as bytes over these plain GETs. tRPC sets
`cache-control: no-transform` on SSE, so `compression` never compresses subscription traffic - the
only way to shrink that channel is to send less through it.

## Commands

```bash
npm run dev            # Backend (tsx watch) + Vite client, concurrently
npm run dev:server     # Backend only            npm run dev:client     # Client only
npm run dev:storybook  # Storybook
npm test               # All vitest projects (client = jsdom, backend = node)
npm run test:client    # or test:backend / test:coverage / test:watch
npm run typecheck:server
npm run typecheck:client
npm run lint:client
npm run build          # Production client build
npm run e2e            # Playwright
```

Prettier covers `client/src` (`npm run format` there); `client/src/index.css` is exempt via
`.prettierignore` because its compact one-line rules are deliberate.

## i18n

Languages: **en, de, es, fr**, plus `en-XA` - a pseudo-locale generated from `en` at load and
reached with `?lng=en-XA`. It accents and pads every string, so anything still rendering as plain
English is hardcoded copy to fix and anything clipped is a layout bug.

- One namespace per JSON file in `client/src/locales/<lang>/`. Keys are typed from the `en` files, so
  a typo in a key is a compile error.
- Adding a language: create the folder, copy the `en` files, and add the code to `LANGUAGES` in
  `client/src/i18n/languages.ts` (it drives both `supportedLngs` and the settings picker). Without
  that the language silently resolves to `en`.
- A game's own copy - title, tagline, how-to steps, config labels, option labels - lives in its
  `game-*.json`. `configCoverage.test.ts` fails on a missing entry.
- Game titles are product names and are NOT translated. Their taglines are.
- Server-side copy does not exist: the server returns `AppErrorCode`s and the client renders them
  with `t('errors:' + code)`. `errorCoverage.test.ts` fails on a code with no message.

## Global Features

- **Dark mode:** `html.dark` class driving Tailwind's `dark:` variant
- **Turn sounds:** 5 WAV options, with a volume preference
- **Streamer mode:** hides the lobby code
- **Reactions:** 5 emoji reactions on results, broadcast live
- **Vibration API** on turn notifications
- **RocketCrab integration** via query params
- **Version mismatch:** the client auto-reloads when the server reports a different version
- **Analytics:** GA4 via `VITE_GA_MEASUREMENT_ID`
- **localStorage keys** - preserve verbatim, note `occDarkMode` uses the `occ` prefix while the rest
  use `ooc`: `occDarkMode`, `oocHideLobby`, `oocTurnSound`, `oocSoundVolume`, `oocName`, `oocLang`,
  `oocMemberId`

# Out Of Context Party Games

Online multiplayer party games - join a lobby with a 4-character code and play collaborative,
telephone-style games in real time. See **[OutOfContext.party](https://www.outofcontext.party)** to play.

Six games: **Raconteur** (story lines), **Dilettante** (drawing chains), **Scribble**
(draw <-> describe telephone), **Redacted** (write -> tamper -> repair), **Hodgepodge** (collaborative
recipes), and **Wurderer** (word-assassin setup).

## Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS v4 + Vite, with Storybook and Vitest. Lives in
  `client/`. Realtime state arrives over a typed **tRPC** client (mutations over HTTP, server push over
  **SSE** subscriptions). Copy is fully externalized to i18next locale files (`client/src/locales/en`).
- **Backend:** TypeScript on Express. A typed **tRPC** router (`server/trpc`) exposes the lobby/game/
  member procedures plus two SSE subscriptions (`lobby.onInfo`, `game.onState`). Game logic lives in
  `core/`; lobby state persists to disk (`core/Persistence.ts`, JSON + pako) as the failover substrate.
- **Shared:** `shared/` holds the types + `AppErrorCode` enum used by both sides; the server sends error
  CODES on the wire, never prose, and the client renders them via `t('errors:' + code)`.

The app is served in production as a single Express instance: `client` builds to `public/`, which the
backend serves along with the SPA fallback, the tRPC endpoint, and the REST shims (`/api/v1/*`).

## Develop

Requires Node 22+.

```bash
npm install            # root deps (backend + tooling)
cd client && npm install && cd ..

npm run dev            # backend (tsx watch, :8080) + Vite client (:3000) together
npm run dev:storybook  # component library / gallery in Storybook
npm test               # all Vitest tests (client jsdom + backend node)
npm run test:client    # client only
npm run test:backend   # backend only
```

The Vite dev server proxies `/trpc` and `/api` to the backend on :8080, so open **http://localhost:3000**
during development. To exercise the production bundle, run `npm run build` (builds the client into
`public/`) then `npm start` and open **http://localhost:8080**.

Useful checks:

```bash
npm run typecheck:server        # tsc over the backend
npm run typecheck:client        # tsc over the client
npm run lint:client             # eslint over client/src
cd client && npm run build-storybook   # compile every story
```

## Locales

All user-facing copy lives in `client/src/locales/<lang>/<namespace>.json`. The filename IS the
namespace, so `lobby.json` is reached as `t('key')` from `useTranslation('lobby')` or as
`t('lobby:key')` from anywhere. Nothing user-facing should be a literal in a component.

**Changing wording:** edit the JSON. Keys are typed from the `en` files, so a typo in a key is a
compile error (`npm run typecheck:client`).

**Adding a namespace:** add `client/src/locales/en/<name>.json`, then register it in two places -
`client/src/i18n/resources.ts` (a static import plus an entry in `en`, which is what gives `t()` its
typed keys) and the `ns` array in `client/src/i18n/index.ts`.

**Adding a language:** create `client/src/locales/<lang>/` and copy the `en` files across. The
runtime resource tree is built from a Vite glob, so no code change is needed to load them - but the
language must also be added to `supportedLngs` in `client/src/i18n/index.ts`. Without that it
silently resolves back to `en`, and everything appears to work while showing English.

Two things are worth knowing when translating:

- **A game's own copy all lives in its `game-*.json`.** Title, tagline, blurb, how-to steps, play
  time, and difficulty, plus a `config` block holding every settings label and dropdown option.
  Translate the values and leave the keys alone - a key is an id copy is looked up by, never
  something a player sees. `client/src/i18n/configCoverage.test.ts` fails on a missing entry.
- **The spelling alphabet is optional.** `lobby.json` carries a `phonetic` table used to read a lobby
  code aloud (`alpha - bravo - ...`). Most languages spell with their own national alphabet rather
  than the NATO words, so translate it rather than transliterating - or omit the block entirely, in
  which case the line is not rendered at all instead of falling back to English.

Server-side copy does not exist: the server returns `AppErrorCode` values and the client renders them
via `t('errors:' + code)`. Add new codes to `shared/errors.ts` and `errors.json` together -
`client/src/i18n/errorCoverage.test.ts` fails on a code with no message.

To find copy that never made it into a locale file, run the client with `?lng=en-XA`. That is a
pseudo-locale generated from `en` at load: it accents and pads every string, so anything still
rendering as plain English is hardcoded, and layouts that break under longer translations show up
while you are still in English.

## Environment

Copy `.env.example` and set values as needed. All are optional with sensible defaults:

- `PORT` - backend port (default 8080)
- `NODE_ENV` - `development` | `production`
- `REDIS_URL` - reserved for the Stage-B horizontal-scale registry (see below); unused today.

The client takes no build-time configuration: there are no `VITE_`-prefixed vars, and fonts are
self-hosted from npm rather than fetched from Google.

## Metrics

No third-party analytics, no cookies, no client-side beacon. Game metrics are server-side and
Prometheus is opt-in via `METRICS_PORT` or `METRICS_TOKEN`; with neither set, no endpoint exists.

See [docs/metrics.md](docs/metrics.md) for the full picture: what is collected, the two ways to
expose it, and the label rules.

## Deploy

Docker + nginx. The image is a multi-stage build (`Dockerfile`): a builder stage compiles the client,
and a slim `node:22-alpine` runtime serves it via the Express backend.

```bash
docker compose build
docker compose up -d      # serves on :8080; mount ./persistence for saved lobbies
```

Put nginx (`nginx.conf`) in front for TLS. SSE requires unbuffered proxying: the `/trpc/` location sets
`proxy_buffering off` and a long read timeout, and HTTP/2 is enabled so concurrent event streams are not
capped by the HTTP/1.1 per-origin limit. Cert paths in `nginx.conf` are placeholders - point them at your
certificate (e.g. a Let's Encrypt/certbot pair).

## Testing

- **Unit / component:** Vitest (`npm test`). Client components render under jsdom; backend game logic
  runs under node. Storybook doubles as living documentation of the component library.
- **End-to-end:** Playwright drives real multi-player play-throughs (`e2e/`). It spawns one browser
  context per player and polls each player's state to drive the dynamic turn order. See `e2e/README.md`.

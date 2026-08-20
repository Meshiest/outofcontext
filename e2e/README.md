# End-to-End Tests (Playwright)

Browser-level, multi-client E2E for Out Of Context. Each player is an
independent `browserContext` (its own localStorage -> its own member id), so a single test can drive a
real N-player play-through - the reason this suite uses Playwright over Cypress.

## Prerequisites

This suite needs two packages that are NOT yet in `package.json` (add them yourself - see below):

```
# add to devDependencies in the ROOT package.json:
#   "@playwright/test": "^1.56.0"
# add to scripts in the ROOT package.json:
#   "e2e": "playwright test"

npm ci                      # root deps (server runtime: tsx, express, trpc, ...)
npm ci --prefix client      # client deps (needed to build the SPA into public/)
npx playwright install      # download the browser binaries (Chromium)
```

## Running

```
npm run e2e                 # build client -> boot backend on :8080 -> run all specs
E2E_NO_BUILD=1 npm run e2e  # skip the client build (assumes public/ is already built)
npx playwright test e2e/games/story.spec.ts     # a single spec
npx playwright test --project=chromium-mobile    # one viewport project
npx playwright show-report                        # open the HTML report after a run
```

The `webServer` in `playwright.config.ts` runs `npm --prefix client run build && npm start`; the
backend (`main.ts`) serves the built client from `public/`, plus tRPC (`/trpc`), the REST shims
(`/api/...`), and the SPA fallback - all on `http://localhost:8080` (the `baseURL`).

## Layout

```
e2e/
  fixtures/multiClient.ts   # the multi-client fixture + Client class + GameDriver + playToCompletion
  games/                    # per-game play-through specs
  flows/                    # cross-cutting flow specs
  tsconfig.json             # typecheck config for the e2e sources
playwright.config.ts        # projects (chromium desktop 1280px + mobile 375px), webServer, baseURL
```

## What the harness gives you

- `openLobby(makeClients, n)` -> `{ clients, code }`: spawns N players, client 0 creates the lobby and
  everyone joins by name (client 0 is the admin).
- `Client`: `createLobby()`, `join(code, name)`, `enterName(name)`, `spectate()`, admin actions
  (`selectGame(title)`, `setConfig(label, value)`, `start()`, `endGame()`, `grantAdminTo(name)`,
  `removePlayer(name)`), and read helpers (`rowFor(name)`).
- `GameDriver` + `playToCompletion(clients, driver)`: the turn engine. It POLLS each client's on-screen
  state and, while any client is EDITING, has that client take exactly one turn - because chain
  assignment is dynamic, "who edits next" is never assumed. `submitAndAwaitProgress` acknowledges each
  turn via the shared game-progress bar so turns are not double-submitted.
- `expectResults(clients, driver)`: asserts the reading/results view renders for every client.

Selectors are role/text/label based against the real DOM. Copy strings are the `en` locale values
(`client/src/locales/en/*.json`); update them here if the locale changes.

## Spec status

| Spec | Status | Notes |
|------|--------|-------|
| `games/story.spec.ts` | COMPLETE | 3 players; numStories=3, numLinks=3, contextLen=1. Plays every turn, asserts context = a prior line, 3x3 lines + attribution, like +1, Done Reading -> WAITING. Reference template. |
| `games/assassin.spec.ts` | COMPLETE | 3 players; numWords=2. Asserts one target + 2 kill words per dossier, targets form a single cycle, Done -> "free to Wurder" -> Show Dossier. |
| `games/comic.spec.ts` | SKELETON (`test.fixme`) | gamemode "both", numLinks=3, colors on. Driver + canvas drawing implemented; result-order + collab-variant assertions are TODO. |
| `games/draw.spec.ts` | SKELETON (`test.fixme`) | numLinks=3. Driver alternates describe/draw; alternating-chain + FROM->TO + timeLimit-countdown assertions are TODO. |
| `games/redacted.spec.ts` | SKELETON (`test.fixme`) | 4 players; gamemode "normal", ink "normal". WRITE implemented; TAMPER word-selection + REPAIR gap-filling + result assertions are TODO. |
| `games/recipe.spec.ts` | SKELETON (`test.fixme`) | 3 players; numSteps=2. All phases sketched incl. the ITEM token; ITEM-block + compiled-result assertions are TODO. |
| `flows/spectator.spec.ts` | SKELETON (`test.fixme`) | Join as spectator -> read-only view + live updates. |
| `flows/admin.spec.ts` | SKELETON (`test.fixme`) | Grant admin, remove player, end game -> WAITING (propagation asserts TODO). |
| `flows/reconnect.spec.ts` | SKELETON (`test.fixme`) | Drop connection (setOffline) + rejoin; also documents the fresh-context replace-by-name path. |
| `flows/direct-url.spec.ts` | SKELETON (`test.fixme`) | `/{code}` (NOT `/lobby/{code}`): name-entry when new, reconnect on reload, NO_LOBBY for bad code. |
| `flows/persistence.spec.ts` | SKELETON (`test.fixme`) | All leave mid-game -> save; rejoin restores state. Needs the server save/cull trigger documented. |

Skeletons are registered with `test.fixme(...)` so a full suite run passes while only the two complete
scenarios execute. Remove `.fixme` (and finish the `TODO(ci)` items) to enable each.

## Mobile/desktop matrix

`playwright.config.ts` defines two Chromium projects - `chromium-desktop` (1280px) and
`chromium-mobile` (375px) - so every spec runs at both layouts. The app ships two deliberate
layouts rather than one fluid shrink, so a scenario passing on desktop says nothing about mobile.

## Client changes made for this suite

Two `data-testid`s were added to `client/src/games/assassin/Dossier.tsx` so the assassin scenario can
read the resolved target reliably (it is otherwise only distinguishable by colour):

- `data-testid="assassin-target"` on the target-name Label.
- `data-testid="assassin-words"` on the kill-words container (its child count = numWords).

No other client source was changed.

## Honest limitations (need a real browser/CI run to validate)

- This environment has NO browsers and cannot run Playwright, so the specs are authored but UNRUN.
  Only `tsc` typechecking has been performed.
- The turn-loop acknowledgement relies on the game-progress bar's rounded percentage changing every
  submit. That holds for the reference board sizes (9 links). Much larger boards can round two
  consecutive turns to the same percent; use a finer ack (e.g. per-chain length) if you scale up.
- Canvas drawing (`drawStroke`) assumes Playwright mouse gestures raise Pointer Events for the Paper.js
  canvas in Chromium; confirm on first real run.
- Exact turn-handoff timing over SSE, the persistence save/cull window, and reconnect behaviour are all
  timing-sensitive and only truly verifiable against the running server.

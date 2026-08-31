/**
 * Multi-client Playwright fixture for the Out Of Context E2E suite.
 *
 * Each "player" is an INDEPENDENT `browserContext` (its own cookies + localStorage), so every player
 * mints a distinct member id (`src/trpc/memberId.ts` persists a `crypto.randomUUID()` per context).
 * That is exactly the real-world topology - N phones, N members, one lobby - and it is why this suite
 * uses Playwright over Cypress: Cypress cannot drive N contexts inside one test.
 *
 * Transport reality this harness assumes (do not change lightly):
 *   - Server -> client updates arrive over SSE (tRPC subscriptions); mutations go over HTTP.
 *   - The client routes lobbies at `/lobby/{code}` (see `client/src/router.tsx`); a bare `/{code}`
 *     hits the SPA fallback and renders NotFoundPage, so joiners silently never arrive.
 *   - Because chain assignment is dynamic, "who edits next" is not deterministic - drive turns by
 *     POLLING each context's on-screen state (see `playToCompletion`), never by fixed waits.
 *
 * All selectors here are role/text/label based against the real DOM in `client/src`. Copy strings are
 * the `en` locale values (see `client/src/locales/en/*.json`); if a string changes, update it here.
 */
import {
  test as base,
  expect,
  type Browser,
  type BrowserContext,
  type Page,
} from '@playwright/test';

export type { Page };

/** The four game phases the UI can present a player. Games use a subset (assassin: READING|DONE). */
export type GamePhase = 'EDITING' | 'WAITING' | 'READING' | 'DONE';

/**
 * A single connected player: an isolated browser context + page, plus its chosen display name once
 * joined. The first client created for a lobby is, by convention, the admin/host.
 */
export class Client {
  constructor(
    readonly context: BrowserContext,
    readonly page: Page,
    public name = '',
  ) {}

  static async create(browser: Browser, name = ''): Promise<Client> {
    const context = await browser.newContext();
    const page = await context.newPage();
    return new Client(context, page, name);
  }

  async dispose(): Promise<void> {
    await this.context.close();
  }

  // --------------------------------------------------------------------------------------------
  // Lobby lifecycle
  // --------------------------------------------------------------------------------------------

  async gotoHome(): Promise<void> {
    await this.page.goto('/');
  }

  /**
   * Host action: create a lobby from the home page and return its 4-char code. HomePage fires the
   * `lobby.create` mutation and, once the server pushes the new code back over the subscription,
   * navigates to `/{code}` - so we wait for that URL and read the code off it.
   */
  async createLobby(): Promise<string> {
    await this.gotoHome();
    await this.page.getByRole('button', { name: 'Create Lobby' }).click();
    await this.page.waitForURL(/\/[a-z0-9]{4}$/i, { timeout: 20_000 });
    const code = this.page.url().split('/').pop()!.toLowerCase();
    return code;
  }

  /** Navigate straight to a lobby by code (direct-URL entry). Does not enter a name. */
  async goToLobby(code: string): Promise<void> {
    await this.page.goto(`/lobby/${code}`);
  }

  /** Full join: open `/{code}` and submit the name-entry form with `name`. */
  async join(code: string, name: string): Promise<void> {
    await this.goToLobby(code);
    await this.enterName(name);
  }

  /** Submit the name-entry form. Assumes the NAME_ENTRY screen is (about to be) showing. */
  async enterName(name: string): Promise<void> {
    this.name = name;
    const field = this.page.getByLabel('Name', { exact: true });
    await field.waitFor({ state: 'visible', timeout: 20_000 });
    await field.fill(name);
    // NameEntry's submit button reads "Join" (lobby:nameEntry.submit).
    await this.page.getByRole('button', { name: 'Join', exact: true }).click();
    // We have left name entry once the member list renders.
    await expect(memberList(this.page)).toBeVisible({ timeout: 20_000 });
  }

  /** Toggle this client from active player to spectator (or, for a spectator, back to players). */
  async spectate(): Promise<void> {
    await this.page.getByRole('button', { name: 'Spectate', exact: true }).click();
  }

  async joinPlayers(): Promise<void> {
    await this.page.getByRole('button', { name: 'Join players', exact: true }).click();
  }

  // --------------------------------------------------------------------------------------------
  // Admin actions (only meaningful for the lobby admin; the server enforces adminProcedure)
  // --------------------------------------------------------------------------------------------

  /**
   * Pick a game in the admin-only selector. `gameTitle` is the game's display title (the dropdown
   * option text, e.g. "Raconteur"), NOT its key - the Select maps title -> key internally.
   */
  async selectGame(gameTitle: string): Promise<void> {
    const combo = this.page.getByRole('combobox', { name: 'Game' });
    await combo.click();
    await this.page.getByRole('option', { name: gameTitle, exact: true }).click();
    await expect(combo).toContainText(gameTitle, { timeout: 15_000 });
  }

  /**
   * Set a config field by its ON-SCREEN label (`cfg.name` in gameInfo, e.g. "Lines per Story").
   * `int` fields render as number inputs; `bool`/`list` fields render as custom Selects - this
   * detects which and drives the right control. For a Select, `value` is the option's visible text.
   */
  async setConfig(fieldLabel: string, value: string | number): Promise<void> {
    const combo = this.page.getByRole('combobox', { name: fieldLabel });
    if (await combo.count()) {
      await combo.click();
      await this.page.getByRole('option', { name: String(value), exact: true }).click();
      return;
    }
    // Number input (role=spinbutton). Fill + blur so React's controlled onChange commits.
    const input = this.page.getByLabel(fieldLabel, { exact: true });
    await input.fill(String(value));
    await input.blur();
  }

  /** Start the game (admin-only). The button is disabled until the config is valid. */
  async start(): Promise<void> {
    const startBtn = this.page.getByRole('button', { name: 'Start Game' });
    await expect(startBtn).toBeEnabled({ timeout: 15_000 });
    await startBtn.click();
  }

  /** End the running game (admin-only). Two-click confirm: "End game" -> "Are you sure?". */
  async endGame(): Promise<void> {
    const btn = this.page.getByRole('button', { name: 'End game' });
    await btn.click();
    await this.page.getByRole('button', { name: 'Are you sure?' }).click();
  }

  /** Grant admin to the player whose row shows `targetName` (arms the shield toggle first). */
  async grantAdminTo(targetName: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Grant admin' }).click();
    await this.rowFor(targetName).getByRole('button', { name: 'Change' }).click();
  }

  /** Remove (demote to spectator) the player whose row shows `targetName`. */
  async removePlayer(targetName: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Remove players' }).click();
    await this.rowFor(targetName).getByRole('button', { name: 'Remove' }).click();
  }

  // --------------------------------------------------------------------------------------------
  // Read helpers
  // --------------------------------------------------------------------------------------------

  /** The player-list row (a real <tr>) containing `name`. */
  rowFor(name: string) {
    return this.page.getByRole('row').filter({ hasText: name });
  }

  /** True if this client currently sees the lobby waiting room (game selector / start controls). */
  async inWaitingRoom(): Promise<boolean> {
    // The member list always shows; the waiting room additionally shows a "Redirect"/game setup or,
    // for the admin, the Start Game button. So this is a loose check, not an exact one.
    return memberList(this.page).isVisible();
  }
}

// ------------------------------------------------------------------------------------------------
// Turn-driving engine
// ------------------------------------------------------------------------------------------------

/**
 * Per-game adapter that teaches `playToCompletion` how to (a) recognise an EDITING turn on a page,
 * (b) perform exactly one editing action for that turn, and (c) recognise the results/reading view.
 * Concrete drivers live next to their spec (see e2e/games/story.spec.ts for the reference).
 */
export interface GameDriver {
  /** Game key (e.g. "story"). */
  readonly id: string;
  /** Display title = dropdown option text + playing-screen heading (e.g. "Raconteur"). */
  readonly title: string;
  /** Player count this scenario requires. */
  readonly players: number;
  /** Config to apply before start, as `{ label, value }` pairs (label = on-screen `cfg.name`). */
  readonly config: ReadonlyArray<{ label: string; value: string | number }>;
  /** True when `page` is on an EDITING turn (its editor is visible). */
  isEditing(page: Page): Promise<boolean>;
  /** True when `page` shows the reading/results view. */
  hasResults(page: Page): Promise<boolean>;
  /** Perform ONE editing action and wait until it is acknowledged (see progress-advance helper). */
  takeTurn(client: Client, ctx: TurnContext): Promise<void>;
}

/** Shared state threaded through a play-through, used for cross-turn assertions. */
export interface TurnContext {
  /** Every unique line submitted so far - lets a driver assert "context = a real previous line". */
  submitted: Set<string>;
  /** Monotonic turn counter. */
  turn: number;
}

/**
 * Read the global game-progress bar's completion (0-100), or null when there is no bar. The bar is
 * hidden at 100% (GameProgress returns null at progress === 1), so `null` also means "complete".
 */
export async function readProgress(page: Page): Promise<number | null> {
  const bar = page.getByRole('progressbar');
  if ((await bar.count()) === 0) return null;
  const raw = await bar.first().getAttribute('aria-valuenow');
  return raw == null ? null : Number(raw);
}

/**
 * Submit-and-acknowledge for chain games: run `submit`, then wait until the shared progress bar
 * advances (or disappears, i.e. the game just completed). Because each editing submit adds exactly
 * one link, the rounded percentage changes every turn as long as `numStories * numLinks` is modest -
 * which the reference scenarios (9 links) guarantee. Larger boards may need a finer ack (see README).
 */
export async function submitAndAwaitProgress(
  page: Page,
  submit: () => Promise<void>,
  timeoutMs = 20_000,
): Promise<void> {
  const before = await readProgress(page);
  await submit();
  let last: number | null = before;
  await expect
    .poll(
      async () => {
        const now = await readProgress(page);
        last = now;
        if (now === null) return true; // bar gone => progress reached 100% (or moved to results)
        if (before === null) return true;
        return now !== before;
      },
      { timeout: timeoutMs },
    )
    .toBe(true)
    // Report the values: "did not advance" is unactionable without knowing what it was stuck on.
    .catch((cause: unknown) => {
      throw new Error(
        `expected game progress to advance after submit (before=${before}, last seen=${last})`,
        { cause },
      );
    });
}

/**
 * The core loop. While ANY client is EDITING, that client performs its game's editing action; the
 * scan restarts after each single turn because a submit can immediately reassign the same player a
 * new chain (dynamic redistribution). Completes when every client shows results.
 */
export async function playToCompletion(
  clients: Client[],
  driver: GameDriver,
  opts: { timeoutMs?: number; pollMs?: number } = {},
): Promise<TurnContext> {
  const timeoutMs = opts.timeoutMs ?? 120_000;
  const pollMs = opts.pollMs ?? 250;
  const ctx: TurnContext = { submitted: new Set<string>(), turn: 0 };
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const results = await Promise.all(clients.map((c) => driver.hasResults(c.page)));
    if (results.every(Boolean)) return ctx;

    let acted = false;
    for (const client of clients) {
      if (await driver.isEditing(client.page)) {
        await driver.takeTurn(client, ctx);
        ctx.turn += 1;
        acted = true;
        break; // re-scan from the top: the just-submitted player may edit again next
      }
    }
    if (!acted) {
      // No one is editing but we are not done -> an SSE turn hand-off is in flight. Poll, don't wait
      // a fixed duration.
      await clients[0].page.waitForTimeout(pollMs);
    }
  }
  throw new Error(`playToCompletion(${driver.id}): timed out after ${timeoutMs}ms`);
}

/** Assert the reading/results view is visible for every client. */
export async function expectResults(clients: Client[], driver: GameDriver): Promise<void> {
  for (const client of clients) {
    await expect
      .poll(() => driver.hasResults(client.page), {
        timeout: 20_000,
        message: `results should render for ${client.name || 'player'}`,
      })
      .toBe(true);
  }
}

// ------------------------------------------------------------------------------------------------
// Test fixture
// ------------------------------------------------------------------------------------------------

export interface MultiClientFixtures {
  /**
   * Spawn `count` independent player clients (one browser context each). Optionally pass display
   * `names`. All spawned contexts are disposed automatically at test teardown.
   */
  makeClients: (count: number, opts?: { names?: string[] }) => Promise<Client[]>;
}

export const test = base.extend<MultiClientFixtures>({
  makeClients: async ({ browser }, use) => {
    const created: Client[] = [];
    const factory = async (count: number, opts?: { names?: string[] }) => {
      const clients: Client[] = [];
      for (let i = 0; i < count; i += 1) {
        const client = await Client.create(browser, opts?.names?.[i] ?? '');
        created.push(client);
        clients.push(client);
      }
      return clients;
    };
    await use(factory);
    for (const client of created) {
      await client.dispose().catch(() => undefined);
    }
  },
});

export { expect };

// ------------------------------------------------------------------------------------------------
// Small utilities
// ------------------------------------------------------------------------------------------------

/** A unique, easily-greppable line for a given author + turn, so context assertions are unambiguous. */
export function uniqueLine(prefix: string, turn: number): string {
  const nonce = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${turn}-${nonce}`;
}

/**
 * Draw a single stroke on the active Doodle `<canvas>` (comic + draw games). The canvas listens to
 * Pointer Events; Playwright's mouse gestures raise pointer events in Chromium, so a down/move.../up
 * across the surface registers one path. A stroke is required before the Doodle "Done" button enables.
 */
export async function drawStroke(page: Page): Promise<void> {
  const canvas = page.locator('canvas').first();
  await canvas.waitFor({ state: 'visible' });
  const box = await canvas.boundingBox();
  if (!box) throw new Error('drawStroke: canvas has no bounding box');
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.25, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.4, y - box.height * 0.15, { steps: 4 });
  await page.mouse.move(box.x + box.width * 0.6, y + box.height * 0.15, { steps: 4 });
  await page.mouse.move(box.x + box.width * 0.75, y, { steps: 4 });
  await page.mouse.up();
}

/**
 * Default display names used across scenarios (distinct + short). Index 0 is the host/admin.
 */
export const NAMES = ['Alice', 'Bob', 'Carol', 'Dave', 'Erin', 'Frank'] as const;

/**
 * Convenience: create N clients, have client 0 create the lobby, and have everyone (including the
 * host) join it by name. Returns the clients and the lobby code. Client 0 is the admin.
 */
/**
 * The lobby member list - the signal that a client is past name entry and into the lobby.
 *
 * Deliberately NOT the "Lobby members" divider: that carries `lg:hidden` (PlayerList.tsx), because
 * on desktop the list is its own titled side rail. So it never renders at the 1280px desktop
 * viewport, and anything waiting for it to be visible times out there no matter what the app does.
 * The Players table header is rendered at every breakpoint.
 */
export const memberList = (page: Page) =>
  page.getByRole('columnheader', { name: /^Players/ });

export async function openLobby(
  makeClients: MultiClientFixtures['makeClients'],
  count: number,
): Promise<{ clients: Client[]; code: string }> {
  const names = NAMES.slice(0, count) as unknown as string[];
  const clients = await makeClients(count, { names });
  const [host, ...rest] = clients;

  const code = await host.createLobby();
  // The host is on `/{code}` but still needs to submit a name.
  await host.enterName(names[0]);
  for (let i = 0; i < rest.length; i += 1) {
    await rest[i].join(code, names[i + 1]);
  }
  return { clients, code };
}

/**
 * Raconteur (story) - COMPLETE reference scenario.
 *
 * 3 players; numStories=3, numLinks=3, contextLen=1 (the default "1 Line").
 * Flow: create -> join x3 -> select + configure -> start -> play EVERY turn -> verify results -> end.
 *
 * This file is the TEMPLATE the other per-game specs follow: it defines a `GameDriver` (how to spot
 * an EDITING turn, how to take one turn, how to spot the results view) and drives the whole game with
 * the shared `playToCompletion` poller. See e2e/fixtures/multiClient.ts for the engine.
 */
import {
  test,
  expect,
  playToCompletion,
  expectResults,
  submitAndAwaitProgress,
  uniqueLine,
  openLobby,
  type GameDriver,
  type Client,
  type TurnContext,
  type Page,
} from '../fixtures/multiClient';

const storyDriver: GameDriver = {
  id: 'story',
  title: 'Raconteur',
  players: 3,
  // contextLen defaults to "1 Line" (regular); numStories defaults to the player count (3). We set
  // both numeric fields explicitly so the scenario is deterministic regardless of defaults.
  config: [
    { label: 'Story Count', value: 3 },
    { label: 'Lines per Story', value: 3 },
  ],

  async isEditing(page: Page): Promise<boolean> {
    return page.getByLabel('The Story Goes...', { exact: true }).isVisible();
  },

  async hasResults(page: Page): Promise<boolean> {
    return page.getByRole('button', { name: /Done Reading|Still Reading/ }).isVisible();
  },

  async takeTurn(client: Client, ctx: TurnContext): Promise<void> {
    const page = client.page;
    const editor = page.getByLabel('The Story Goes...', { exact: true });
    await expect(editor).toBeVisible();

    // "The shown context = the previous author's line": on any non-first turn with contextLen=1 the
    // editor shows exactly one earlier line, which must be one of the lines already submitted.
    const firstLine = await page.getByText('Write the first line').isVisible();
    if (!firstLine && ctx.submitted.size > 0) {
      const bodyText = await page.locator('body').innerText();
      const showsPriorLine = [...ctx.submitted].some((line) => bodyText.includes(line));
      expect(showsPriorLine, 'EDITING context should display a previously written line').toBe(true);
    }

    const line = uniqueLine(`story-${client.name}`, ctx.turn);
    await submitAndAwaitProgress(page, async () => {
      await editor.fill(line);
      // Submit reads "Sign" on a normal link, "Finish" (positive) on the last link of a chain.
      await page.getByRole('button', { name: /^(Sign|Finish)$/ }).click();
    });
    ctx.submitted.add(line);
  },
};

test('Raconteur: 3 players write 3 stories of 3 lines each, then like + finish reading', async ({
  makeClients,
}) => {
  const { clients } = await openLobby(makeClients, storyDriver.players);
  const [host] = clients;

  // Configure (admin only).
  await host.selectGame(storyDriver.title);
  for (const { label, value } of storyDriver.config) {
    await host.setConfig(label, value);
  }
  await host.start();

  // Everyone should land in a game phase (editor, waiting loader, or - eventually - results).
  for (const client of clients) {
    await expect
      .poll(
        async () =>
          (await storyDriver.isEditing(client.page)) ||
          (await storyDriver.hasResults(client.page)) ||
          client.page.getByText('Waiting on Other Authors').isVisible(),
        { timeout: 20_000 },
      )
      .toBe(true);
  }

  // Drive every EDITING turn across all three players until all chains are full.
  await playToCompletion(clients, storyDriver);

  // Results must render for ALL players.
  await expectResults(clients, storyDriver);

  for (const client of clients) {
    const page = client.page;
    // 3 stories -> 3 like controls (one heart per ChainCard).
    await expect(page.getByRole('button', { name: /like/ })).toHaveCount(3);
    // 3 stories x 3 lines = 9 rendered story lines.
    await expect(page.locator('p.story-body')).toHaveCount(9);
    // Author attribution: every player's name appears in the results (each wrote >=1 line).
    for (const client2 of clients) {
      await expect(page.getByText(`-${client2.name}`, { exact: false }).first()).toBeVisible();
    }
  }

  // Like a story on the host: the first heart goes 0 -> 1.
  const firstHeart = host.page.getByRole('button', { name: /like/ }).first();
  await expect(firstHeart).toHaveAccessibleName(/0 like/);
  await firstHeart.click();
  await expect(firstHeart).toHaveAccessibleName(/1 like/);

  // Everyone marks Done Reading; when the last player does, the server ends the game -> WAITING.
  for (const client of clients) {
    await client.page.getByRole('button', { name: 'Done Reading' }).click();
  }

  // Back in the waiting room: the game is still selected, so the admin sees Start Game again and the
  // reading controls are gone.
  await expect(host.page.getByRole('button', { name: 'Start Game' })).toBeVisible({
    timeout: 20_000,
  });
  await expect(
    host.page.getByRole('button', { name: /Done Reading|Still Reading/ }),
  ).toBeHidden();
});

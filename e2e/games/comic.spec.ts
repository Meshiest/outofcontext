/**
 * Dilettante (comic) - SKELETON.
 *
 * 3 players; gamemode "both" (draw + caption), numLinks=3, colors on. The driver + play-through wiring
 * is provided; the per-phase assertions (sequences render drawings + captions IN ORDER, and the
 * `collab` continuous variant stacks canvases with no gaps) are TODOs for the CI author to finish.
 *
 * Uses the same fixture/engine as the story reference (see e2e/games/story.spec.ts).
 */
import {
  test,
  expect,
  playToCompletion,
  expectResults,
  submitAndAwaitProgress,
  drawStroke,
  uniqueLine,
  openLobby,
  type GameDriver,
  type Client,
  type TurnContext,
  type Page,
} from '../fixtures/multiClient';

const comicDriver: GameDriver = {
  id: 'comic',
  title: 'Dilettante',
  players: 3,
  // NOTE: list-config option labels are `option.more || option.text` (see ConfigField). For gamemode
  // "both" that visible label is "See Drawings and Captions"; for the colors bool it is "Enabled".
  config: [
    { label: 'Chain Count', value: 3 },
    { label: 'Drawings per Chain', value: 3 },
    { label: 'Game Mode', value: 'See Drawings and Captions' }, // gamemode = both (draw + caption)
    { label: 'Colored Drawings', value: 'Enabled' }, // colors on
  ],

  async isEditing(page: Page): Promise<boolean> {
    // The Doodle "Done" button is present only while drawing (exact avoids "Done Reading").
    return page.getByRole('button', { name: 'Done', exact: true }).isVisible();
  },

  async hasResults(page: Page): Promise<boolean> {
    return page.getByRole('button', { name: /Done Reading|Still Reading/ }).isVisible();
  },

  async takeTurn(client: Client, ctx: TurnContext): Promise<void> {
    const page = client.page;
    const caption = uniqueLine(`comic-${client.name}`, ctx.turn);

    await submitAndAwaitProgress(page, async () => {
      // gamemode "both" collects a caption; fill it before the drawing so Done enables.
      const captionField = page.getByLabel('Caption', { exact: true });
      if (await captionField.count()) await captionField.fill(caption);
      await drawStroke(page);
      await page.getByRole('button', { name: 'Done', exact: true }).click();
    });
    ctx.submitted.add(caption);
  },
};

// SKELETON: registered but marked fixme so it does not run until the result-phase assertions below
// are finished. Remove `.fixme` once the TODOs are implemented.
test.fixme('Dilettante: 3 players draw + caption a 3-link comic [SKELETON]', async ({
  makeClients,
}) => {
  const { clients } = await openLobby(makeClients, comicDriver.players);
  const [host] = clients;

  await host.selectGame(comicDriver.title);
  for (const { label, value } of comicDriver.config) {
    await host.setConfig(label, value);
  }
  await host.start();

  await playToCompletion(clients, comicDriver);
  await expectResults(clients, comicDriver);

  // TODO(ci): assert each sequence renders its drawings (read-only <canvas>) AND captions in order,
  // with author attribution; then finish reading. See ComicResults.tsx for the DOM shape.
  // TODO(ci): variant - re-run with gamemode "collab" (continuous) and assert the stacked canvases
  //           connect with no gaps (ComicChain continuous layout).
  for (const client of clients) {
    await expect(client.page.getByText('Sequences')).toBeVisible();
  }
});

/**
 * Scribble (draw) - SKELETON.
 *
 * 3 players; numLinks=3 (odd). Turn 1 = describe (text); then alternate draw <-> describe by link
 * type. The driver detects which half of the turn is showing (a "Describe" submit vs the Doodle
 * "Done") and acts accordingly. Per-phase result assertions (alternating desc/image, the FROM->TO
 * summary on the odd-length chain) and the timeLimit-countdown variant are TODOs.
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

const drawDriver: GameDriver = {
  id: 'draw',
  title: 'Scribble',
  players: 3,
  config: [{ label: 'Round Count', value: 3 }],

  async isEditing(page: Page): Promise<boolean> {
    // Describe half shows a "Describe" submit; draw half shows the Doodle "Done" (exact).
    const describing = await page.getByRole('button', { name: 'Describe', exact: true }).isVisible();
    const drawing = await page.getByRole('button', { name: 'Done', exact: true }).isVisible();
    return describing || drawing;
  },

  async hasResults(page: Page): Promise<boolean> {
    return page.getByRole('button', { name: /Done Reading|Still Reading/ }).isVisible();
  },

  async takeTurn(client: Client, ctx: TurnContext): Promise<void> {
    const page = client.page;
    const describeBtn = page.getByRole('button', { name: 'Describe', exact: true });

    await submitAndAwaitProgress(page, async () => {
      if (await describeBtn.isVisible()) {
        const text = uniqueLine(`draw-${client.name}`, ctx.turn);
        await page.locator('textarea').first().fill(text);
        await describeBtn.click();
        ctx.submitted.add(text);
      } else {
        await drawStroke(page);
        await page.getByRole('button', { name: 'Done', exact: true }).click();
      }
    });
  },
};

// SKELETON: registered but marked fixme until the result-phase assertions below are finished.
test.fixme('Scribble: 3 players alternate draw <-> describe over 3 rounds [SKELETON]', async ({
  makeClients,
}) => {
  const { clients } = await openLobby(makeClients, drawDriver.players);
  const [host] = clients;

  await host.selectGame(drawDriver.title);
  for (const { label, value } of drawDriver.config) {
    await host.setConfig(label, value);
  }
  await host.start();

  await playToCompletion(clients, drawDriver);
  await expectResults(clients, drawDriver);

  // TODO(ci): assert each chain shows alternating description / image links and the "From -> To"
  //           summary on the odd-length chain (see DrawResults.tsx / DrawChainDisplay.tsx).
  // TODO(ci): variant - set a "Time Limit" (e.g. "5 seconds") and assert the client countdown Timer
  //           appears once drawing starts (DrawEditor -> Doodle timer).
  for (const client of clients) {
    await expect(client.page.getByText('Chains')).toBeVisible();
  }
});

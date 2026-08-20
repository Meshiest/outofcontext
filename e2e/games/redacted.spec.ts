/**
 * Redacted - SKELETON (4 players - its minimum).
 *
 * gamemode "normal" (censor + truncate, both `player`), ink "normal" (10). Each line runs a full
 * three-phase cycle: WRITE (1-256, >=1 word) -> TAMPER (censor word indexes OR truncate a count,
 * respecting the ink budget) -> REPAIR (fill gaps / replacement). Results show censored+repaired
 * lines with all three authors and the redaction-bar styling.
 *
 * The WRITE and REPAIR phases are text-only; the TAMPER phase requires selecting words on the canvas
 * of the story (WordSelector / TruncateSelector) - that interaction is the main TODO. Marked fixme
 * until the tamper + repair actions and the result-shape assertions are implemented.
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

const redactedDriver: GameDriver = {
  id: 'redacted',
  title: 'Redacted',
  players: 4,
  config: [
    { label: 'Story Count', value: 2 },
    { label: 'Lines per Story', value: 2 },
    { label: 'Game Mode', value: 'Normal' }, // gamemode = normal (censor + truncate)
    { label: 'Changes', value: 'Normal - 2 middle, 5 end' }, // ink = normal (10)
  ],

  async isEditing(page: Page): Promise<boolean> {
    // Write -> "Sign"; Tamper -> "Censor Story"/"Truncate Story"; Repair -> "Repair".
    return page
      .getByRole('button', { name: /^(Sign|Repair|Censor Story|Truncate Story)$/ })
      .isVisible();
  },

  async hasResults(page: Page): Promise<boolean> {
    return page.getByRole('button', { name: /Done Reading|Still Reading/ }).isVisible();
  },

  async takeTurn(client: Client, ctx: TurnContext): Promise<void> {
    const page = client.page;

    await submitAndAwaitProgress(page, async () => {
      // --- WRITE phase (no prior link, or continuing after a repair) ---
      const sign = page.getByRole('button', { name: 'Sign', exact: true });
      if (await sign.isVisible()) {
        const line = uniqueLine(`redacted-${client.name}`, ctx.turn);
        await page.locator('textarea').first().fill(line);
        await sign.click();
        ctx.submitted.add(line);
        return;
      }

      // --- TAMPER phase ---
      // TODO(ci): the tamper editor shows the previous line with each word clickable.
      //   Censor mode: click 1-2 words (aria-label "Toggle censor on word: <word>"), staying within
      //     the ink budget (InkBudget), then click "Censor Story".
      //   Truncate mode: click a word to truncate from (aria-label "Truncate the story from: <word>")
      //     then click "Truncate Story". Toggle mode via the "Censor"/"Truncate" buttons.
      // For "normal" gamemode both modes are available; pick censor for determinism.
      const censorStory = page.getByRole('button', { name: 'Censor Story', exact: true });
      const truncateStory = page.getByRole('button', { name: 'Truncate Story', exact: true });
      if ((await censorStory.isVisible()) || (await truncateStory.isVisible())) {
        throw new Error('TODO(ci): implement Redacted tamper-phase word selection');
      }

      // --- REPAIR phase ---
      // TODO(ci): CensorRepair shows a "Word N" input per censored gap -> fill each, then "Repair".
      //   TruncateRepair shows a single continuation textarea -> fill, then "Repair".
      const repair = page.getByRole('button', { name: 'Repair', exact: true });
      if (await repair.isVisible()) {
        throw new Error('TODO(ci): implement Redacted repair-phase gap filling');
      }
    });
  },
};

// SKELETON: fixme until the tamper + repair editing actions above are implemented.
test.fixme('Redacted: 4 players run the write -> tamper -> repair cycle [SKELETON]', async ({
  makeClients,
}) => {
  const { clients } = await openLobby(makeClients, redactedDriver.players);
  const [host] = clients;

  await host.selectGame(redactedDriver.title);
  for (const { label, value } of redactedDriver.config) {
    await host.setConfig(label, value);
  }
  await host.start();

  await playToCompletion(clients, redactedDriver);
  await expectResults(clients, redactedDriver);

  // TODO(ci): assert results show censored + repaired lines with all three contributing authors and
  //           the redaction-bar styling (see RedactedResults.tsx / RedactedLine.tsx).
  // TODO(ci): variant - run gamemode "Random" (chaos) to exercise the auto-tamper path (no player
  //           tamper turn); the play loop should complete without a tamper action.
  for (const client of clients) {
    await expect(client.page.getByText('Stories')).toBeVisible();
  }
});

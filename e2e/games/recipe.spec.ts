/**
 * Hodgepodge (recipe) - SKELETON.
 *
 * 3 players; numRecipes, numSteps=2. Phase order per chain: theme -> steps (each MUST contain the
 * literal token ITEM) -> ingredients -> comments. The compiled recipe shows the theme, numbered steps
 * with ITEM replaced by an ingredient, and comments with authors.
 *
 * The editing actions ARE sketched below (all four phases are text via RecipeLineForm), including the
 * ITEM requirement. Marked fixme until the "submit blocked without ITEM" assertion and the compiled
 * result-shape assertions are finalized.
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

const recipeDriver: GameDriver = {
  id: 'recipe',
  title: 'Hodgepodge',
  players: 3,
  config: [
    { label: 'Recipe Count', value: 3 },
    { label: 'Steps per Recipe', value: 2 },
  ],

  async isEditing(page: Page): Promise<boolean> {
    // Every recipe editor uses RecipeLineForm -> a "Sign" or "Finish" submit.
    return page.getByRole('button', { name: /^(Sign|Finish)$/ }).isVisible();
  },

  async hasResults(page: Page): Promise<boolean> {
    return page.getByRole('button', { name: /Done Reading|Still Reading/ }).isVisible();
  },

  async takeTurn(client: Client, ctx: TurnContext): Promise<void> {
    const page = client.page;
    const submit = page.getByRole('button', { name: /^(Sign|Finish)$/ });
    const field = page.locator('textarea').first();

    // Phase is identified by the editor header.
    const isStep = await page.getByText(/Write an instruction for/).isVisible();
    let text: string;
    if (isStep) {
      // Steps MUST contain the literal token ITEM (server + client both enforce it).
      // TODO(ci): first assert submit is DISABLED with a non-ITEM value, e.g.:
      //   await field.fill('stir well'); await expect(submit).toBeDisabled();
      text = `add the ITEM and ${uniqueLine(`recipe-${client.name}`, ctx.turn)}`;
    } else {
      // theme / ingredient / comment are free text.
      text = uniqueLine(`recipe-${client.name}`, ctx.turn);
    }

    await submitAndAwaitProgress(page, async () => {
      await field.fill(text);
      await submit.click();
    });
    ctx.submitted.add(text);
  },
};

// SKELETON: fixme until the ITEM-block assertion + compiled-result assertions are added.
test.fixme('Hodgepodge: 3 players build recipes (theme/steps/ingredients/comments) [SKELETON]', async ({
  makeClients,
}) => {
  const { clients } = await openLobby(makeClients, recipeDriver.players);
  const [host] = clients;

  await host.selectGame(recipeDriver.title);
  for (const { label, value } of recipeDriver.config) {
    await host.setConfig(label, value);
  }
  await host.start();

  await playToCompletion(clients, recipeDriver);
  await expectResults(clients, recipeDriver);

  // TODO(ci): assert each compiled recipe shows its theme, numbered steps with ITEM replaced by an
  //           ingredient (no literal "ITEM" left in the step text), and comments with author names
  //           (see RecipeResults.tsx / RecipeCard.tsx).
  for (const client of clients) {
    await expect(client.page.getByText('Recipes')).toBeVisible();
  }
});

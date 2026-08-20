/**
 * Wurderer (assassin) - COMPLETE reference scenario.
 *
 * 3 players; numWords=2 (the default). Assassin has NO chain loop, NO results/like phase and NO
 * progress bar - on start every player is handed a dossier (one target + N kill words). The correctness
 * gate here is topological: the per-player targets must form a SINGLE cycle covering all players
 * (server builds `shuffled[i] -> shuffled[i+1 mod n]`), and the Done / Show Dossier toggle must work.
 *
 * Reads the target + kill words via two `data-testid`s in client/src/games/assassin/Dossier.tsx
 * (`assassin-target`, `assassin-words`) - the resolved target name is otherwise only distinguishable
 * by colour, which is brittle.
 */
import { test, expect, openLobby, type Client } from '../fixtures/multiClient';

const NUM_WORDS = 2;

/** Wait until this client is showing its dossier (READING phase) and return the target's name. */
async function readTarget(client: Client): Promise<string> {
  const target = client.page.getByTestId('assassin-target');
  await expect(target).toBeVisible({ timeout: 20_000 });
  return (await target.innerText()).trim();
}

test('Wurderer: 3 players each get one target + 2 kill words forming a single cycle', async ({
  makeClients,
}) => {
  const { clients } = await openLobby(makeClients, 3);
  const [host] = clients;

  // numWords defaults to 2 and battleRoyale defaults to false, so no config is required.
  await host.selectGame('Wurderer');
  await host.start();

  // Every player lands on a dossier. Build the name -> targetName assignment map.
  const targetOf = new Map<string, string>();
  for (const client of clients) {
    const targetName = await readTarget(client);
    targetOf.set(client.name, targetName);

    // Exactly one target (single-target mode) and exactly numWords kill words.
    await expect(client.page.getByTestId('assassin-target')).toHaveCount(1);
    await expect(client.page.getByTestId('assassin-words').locator('span')).toHaveCount(NUM_WORDS);
    expect(targetName).not.toBe(client.name);
  }

  // Assert the assignment is a SINGLE cycle over all players: follow targets from any start and we
  // must visit every distinct player exactly once before returning to the start.
  const names = clients.map((c) => c.name);
  const visited: string[] = [];
  let current = names[0];
  for (let i = 0; i < names.length; i += 1) {
    visited.push(current);
    const next = targetOf.get(current);
    expect(next, `every player has a target (missing for ${current})`).toBeDefined();
    current = next!;
  }
  // After N hops we are back at the start, and we saw all N players exactly once.
  expect(current).toBe(names[0]);
  expect(new Set(visited).size).toBe(names.length);
  expect([...visited].sort()).toEqual([...names].sort());

  // Done -> "free to Wurder" -> Show Dossier returns to the dossier.
  await host.page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(
    host.page.getByText("You are now free to Wurder to your heart's content"),
  ).toBeVisible();
  await expect(host.page.getByTestId('assassin-target')).toBeHidden();

  await host.page.getByRole('button', { name: 'Show Dossier', exact: true }).click();
  await expect(host.page.getByTestId('assassin-target')).toBeVisible();
});

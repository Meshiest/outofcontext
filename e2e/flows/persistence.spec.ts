/**
 * Cross-cutting flow: PERSISTENCE / FAILOVER - SKELETON.
 *
 * All players leave mid-game -> the lobby state is saved (JSON + pako, core/Persistence). Rejoining the
 * same code restores the game state. This is also the substrate a second instance would fail over
 * from, if horizontal scale is ever turned on.
 *
 * Timing caveat (why this is a skeleton): the save is triggered by the lobby emptying / the inactivity
 * cull, which is time-based on the server. A real run must either wait out that window or expose a test
 * hook. Document the exact trigger before de-fixme-ing.
 */
import { test, expect, openLobby } from '../fixtures/multiClient';

test.fixme('Lobby state persists when everyone leaves and is restored on rejoin [SKELETON]', async ({
  makeClients,
  browser,
  request,
}) => {
  const { clients, code } = await openLobby(makeClients, 3);
  const [host] = clients;

  await host.selectGame('Raconteur');
  await host.setConfig('Lines per Story', 3);
  await host.start();
  await expect(host.page.getByText('Lobby members')).toBeVisible();

  // TODO(ci): advance the game a few turns (reuse the story driver) so there is non-trivial state to
  //   persist, then capture a fingerprint of that state (e.g. progress value, some visible line).

  // Everyone leaves (close all contexts).
  for (const client of clients) await client.dispose();

  // TODO(ci): wait for the server's save/cull to fire (document the trigger + window). The REST shim
  //   `GET /api/v1/lobby/:code` can be polled to confirm the lobby still exists after the cull:
  const stillExists = await request.get(`/api/v1/lobby/${code}`);
  expect(stillExists.ok()).toBeTruthy();

  // Rejoin with a fresh member and assert the game state was restored (still PLAYING, same progress).
  const rejoiner = await browser.newContext();
  const page = await rejoiner.newPage();
  await page.goto(`/${code}`);
  await page.getByLabel('Name', { exact: true }).fill('Restorer');
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  // TODO(ci): assert the restored game view (running game / restored progress), not a fresh WAITING room.
  await expect(page.getByText('Lobby members')).toBeVisible();
  await rejoiner.close();
});

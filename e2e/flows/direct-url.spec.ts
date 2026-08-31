/**
 * Cross-cutting flow: DIRECT URL - SKELETON.
 *
 * NOTE ON THE ROUTE: the milestone text says `/lobby/CODE`, but the REWRITTEN client routes lobbies at
 * `/{code}` (see LobbyPage `useParams` + all `navigate('/' + code)` calls).
 *
 * Behaviour to prove:
 *   - Not yet joined: opening `/{code}` shows the name-entry screen for a valid code.
 *   - Already in (same context): a reload of `/{code}` reconnects without re-entering the name (the
 *     member id persists in localStorage and the server remembers the member's name).
 *   - Invalid / too-short code: the NO_LOBBY screen ("Invalid Lobby").
 *
 * Marked fixme until assertions are finalized.
 */
import { test, expect, openLobby, memberList } from '../fixtures/multiClient';

test.fixme('Direct URL entry: name-entry when new, reconnect when already in [SKELETON]', async ({
  makeClients,
  browser,
}) => {
  const { code } = await openLobby(makeClients, 1); // one existing member creates a valid lobby

  // --- New visitor lands on name entry ---
  const fresh = await browser.newContext();
  const page = await fresh.newPage();
  await page.goto(`/${code}`);
  await expect(page.getByLabel('Name', { exact: true })).toBeVisible();

  // Enter a name -> waiting room.
  await page.getByLabel('Name', { exact: true }).fill('Zed');
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  await expect(memberList(page)).toBeVisible();

  // --- Reload keeps them in the lobby (reconnect by persisted member id), no name re-entry ---
  await page.reload();
  // TODO(ci): assert the member list is shown WITHOUT the name-entry field reappearing.
  await expect(memberList(page)).toBeVisible();
  await expect(page.getByLabel('Name', { exact: true })).toBeHidden();

  await fresh.close();

  // --- Invalid code -> NO_LOBBY ---
  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await otherPage.goto('/zzzz');
  // TODO(ci): assert the "Invalid Lobby" screen (lobby:invalidLobby.title) renders.
  await expect(otherPage.getByText('Invalid Lobby')).toBeVisible();
  await other.close();
});

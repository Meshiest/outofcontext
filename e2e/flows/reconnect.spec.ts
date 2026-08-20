/**
 * Cross-cutting flow: RECONNECT MID-GAME - SKELETON.
 *
 * Drop a player's connection, rejoin -> the member is replaced (was `lobby:replace`) and state is
 * intact. Two ways to simulate a drop; the skeleton shows the same-context path (simplest + closest
 * to a real network blip):
 *
 *   A. Same context, `context.setOffline(true/false)`: the member id in localStorage is unchanged, so
 *      on reconnect LobbyPage re-validates + re-joins the SAME member (see LobbyPage reconnect effect).
 *   B. Fresh context, same display name: a NEW member id auto-rejoins the disconnected seat by name
 *      (NameEntry auto-rejoin -> replaceMember). Use this to exercise the `replace` path explicitly.
 *
 * Marked fixme until the "state intact" assertions are finalized.
 */
import { test, expect, openLobby } from '../fixtures/multiClient';

test.fixme('Player reconnects mid-game with state intact [SKELETON]', async ({ makeClients }) => {
  const { clients, code } = await openLobby(makeClients, 3);
  const [host, , carol] = clients;

  await host.selectGame('Raconteur');
  await host.setConfig('Lines per Story', 3);
  await host.start();
  await expect(carol.page.getByText('Lobby members')).toBeVisible();

  // TODO(ci): capture Carol's current phase (editor visible? waiting?) before the drop.

  // --- Path A: transient network drop on the same context ---
  await carol.context.setOffline(true);
  // TODO(ci): assert the global "Lost connection" overlay appears (common.connection.lost).
  await carol.context.setOffline(false);

  // TODO(ci): assert Carol is back in the SAME lobby (`/${code}`) and her game phase is restored -
  //   the LobbyPage reconnect effect re-validates the code and re-joins the same member id.
  await expect(carol.page).toHaveURL(new RegExp(`/${code}$`));

  // --- Path B (alternative): fresh context reclaims the seat by name ---
  // const replacement = (await makeClients(1, { names: [carol.name] }))[0];
  // await replacement.join(code, carol.name); // NameEntry auto-rejoin -> replaceMember
  // TODO(ci): assert the replacement lands directly in the running game (no duplicate player row).
});

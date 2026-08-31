/**
 * Cross-cutting flow: ADMIN CONTROLS - SKELETON.
 *
 * Grant admin to another player, remove a player, end game -> back to WAITING (all propagate over the
 * lobby subscription to every client). Admin actions are genuinely admin-gated server-side
 * (adminProcedure), fixing the legacy no-parens `player.isAdmin` bypass. Marked fixme until the
 * propagation assertions are finalized.
 */
import { test, expect, openLobby, memberList } from '../fixtures/multiClient';

test.fixme('Admin can grant admin, remove a player, and end the game [SKELETON]', async ({
  makeClients,
}) => {
  const { clients } = await openLobby(makeClients, 3);
  const [host, bob, carol] = clients;

  // --- Grant admin to Bob ---
  await host.grantAdminTo(bob.name);
  // TODO(ci): assert the admin shield badge (Label aria-label "You are the admin") now shows for Bob
  //   and is gone for the host; assert Bob now sees the Game Settings / game selector.
  await expect(bob.page.getByLabel('You are the admin')).toBeVisible();

  // --- Remove Carol (demote to spectator) ---
  // Bob is admin now, so Bob performs the removal.
  await bob.removePlayer(carol.name);
  // TODO(ci): assert Carol moves from the Players table to the Spectators table on every client.

  // --- Start then end a game ---
  await bob.selectGame('Raconteur');
  await bob.setConfig('Lines per Story', 3);
  await bob.start();
  await expect(memberList(bob.page)).toBeVisible();

  await bob.endGame();
  // TODO(ci): assert every remaining client returns to the WAITING room (Start Game visible to the
  //   admin; the game canvas gone) - endGame sets lobbyState back to WAITING but keeps the selection.
  await expect(bob.page.getByRole('button', { name: 'Start Game' })).toBeVisible();
});

/**
 * Cross-cutting flow: SPECTATOR - SKELETON.
 *
 * Join as spectator -> read-only game view + live updates. A spectator has no player game-state, so
 * they never see an editor or a "Done Reading" toggle, and the like control renders as a static count
 * Label (not a button). They should still see the results view and receive live updates as players
 * act. Marked fixme until the read-only assertions are finalized.
 */
import { test, expect, openLobby } from '../fixtures/multiClient';

test.fixme('Spectator sees a read-only game view with live updates [SKELETON]', async ({
  makeClients,
}) => {
  // 2 players + 1 that will spectate.
  const { clients } = await openLobby(makeClients, 3);
  const [host, , watcher] = clients;

  // Move the third client to spectators before the game starts.
  await watcher.spectate();
  // TODO(ci): assert `watcher` now appears under the "Spectators" table, not "Players".

  await host.selectGame('Raconteur');
  await host.setConfig('Lines per Story', 3);
  await host.start();

  // TODO(ci): drive the two players through the story (reuse the story driver + a filtered
  //   playToCompletion over just the active players), and while they play assert that `watcher`:
  //     - never shows the "The Story Goes..." editor,
  //     - never shows a "Done Reading" / "Still Reading" button,
  //     - eventually shows the results ("Stories") with like controls rendered as static Labels
  //       (role !== button; LikeButton disabled path).
  await expect(watcher.page.getByText('Lobby members')).toBeVisible();
});

import _ from 'lodash';
import { Game } from './game.js';
import { Chain } from './util/Chain.js';
import * as Sanitize from './util/Sanitize.js';
import type { Lobby } from '../Lobby.js';
import type { ResolvedGameConfig } from './game.js';
import type { GameState, PlayerState } from '@shared/types';
import type { GameMessageType } from '@shared/events';
import { applyReaction, countReactions, reactionFlags } from './util/reactions.js';

// A story's chain link is a plain line string; subclasses override `chains` content shapes as needed
// (kept as Chain<any> so Comic/Draw/Recipe/Redacted can store their own link objects).
interface StorySaveBlob {
  version: 1;
  chains: ReturnType<Chain['save']>[];
  finishedReading: Record<string, boolean>;
}

export class Story extends Game {
  chains: Chain<any>[] = [];
  clearance: number;
  lastEdit: Record<string, number> = {};
  finishedReading: Record<string, boolean> = {};
  // Cached compiled results (shape differs per subclass, hence any).
  compiled?: any;

  constructor(lobby: Lobby, config: ResolvedGameConfig, players: string[]) {
    super(lobby, config, players);
    this.chains = [];
    this.clearance = Math.min(config.players - 1, config.contextLen + 1);
    this.lastEdit = {};
    for (const p of players) this.lastEdit[p] = 0;
    this.finishedReading = {};
  }

  override restore(blob: unknown): void {
    const b = blob as StorySaveBlob;
    if (b.version !== 1) return;
    this.chains = b.chains.map((c) => Chain.restore(c));
    this.finishedReading = b.finishedReading;
  }

  override save(): unknown {
    const blob: StorySaveBlob = {
      version: 1,
      chains: this.chains.map((s) => s.save()),
      finishedReading: this.finishedReading,
    };
    return blob;
  }

  findChainForPlayer(player: string): Chain<any> | undefined {
    const { numLinks } = this.config;

    // Order chains by length (shortest chains get touched first)
    let available = _.sortBy(
      this.chains.filter(
        (s) =>
          !s.editor && // only chains that are not being worked on
          s.chain.length < numLinks && // not yet at capacity
          s.lastEditor !== player && // not one the player just edited
          (s.collaborators[player] || 0) <= s.avgEdits(), // under-contributed
      ),
      (s) => s.chain.length,
    );

    // If there are enough players, avoid alternating the same recent editors
    if (this.players.length !== this.clearance)
      available = available.filter(
        (s) => !s.editors.slice(-this.clearance).includes(player),
      );

    return available[0];
  }

  override start(): void {
    const numPlayers = this.players.length;
    const { numStories, numLinks } = this.config;

    this.chains = _.range(numStories).map(
      () => new Chain(numPlayers, numLinks),
    );

    // Every player has an equal chance of getting a story
    const players = _.shuffle(this.players);
    for (const player of players) {
      const story = this.findChainForPlayer(player);
      if (!story) break;
      story.editor = player;
    }

    this.sendGameInfo();
  }

  /**
   * Assign chains to players who are not working on one.
   *
   * Chains held by a player who is no longer connected are released first. Without that, a player
   * booted for inactivity keeps their chain forever - they will never submit it, nobody else can be
   * given it, and the round stalls with every remaining player showing as waiting. Their SEAT is
   * still theirs; only the chain goes back in the pool, so reclaiming it later still works.
   */
  redistribute(): void {
    const connected = new Set(this.connectedPlayers());

    for (const chain of this.chains) {
      if (chain.editor && !connected.has(chain.editor)) chain.editor = '';
    }

    const hasStory = this.chains
      .filter((s) => s.editor)
      .reduce(
        (obj, i) => ({ ...obj, [i.editor]: true }),
        {} as Record<string, boolean>,
      );

    const players = _.sortBy(
      this.players.filter((p) => !hasStory[p] && connected.has(p)),
      (p) => this.lastEdit[p],
    );

    for (const player of players) {
      const story = this.findChainForPlayer(player);
      if (!story) continue;
      story.editor = player;
    }

    this.unstick(players);
    this.sendGameInfo();
  }

  /**
   * Last resort when nobody ended up with a chain.
   *
   * `findChainForPlayer` refuses to hand a player a chain they just edited, or one their recent
   * turns are still inside. Those rules keep a full lobby's stories varied, but once enough players
   * have left they can rule out every remaining option and leave the round with no active editor at
   * all - permanently, since only an edit triggers the next deal. Repeating an editor is a worse
   * story; no editor is a dead game.
   */
  private unstick(candidates: string[]): void {
    if (this.chains.some((s) => s.editor)) return;
    const open = this.chains.find((s) => s.chain.length < this.config.numLinks);
    if (!open || candidates.length === 0) return;
    open.editor =
      candidates.find((p) => p !== open.lastEditor) ?? candidates[0];
  }

  /** A player connected or dropped: re-deal so no chain is left with an absent editor. */
  override onPlayersChanged(): void {
    if (this.getGameProgress() >= 1) return;
    this.redistribute();
  }

  override stop(): void {}

  override cleanup(): void {}

  override handleMessage(pid: string, type: GameMessageType, data: unknown): void {
    switch (type) {
      case 'story:result': {
        if (this.getGameProgress() === 1) {
          this.emitTo(pid, 'story:result', this.compileStories());
        }
        break;
      }

      case 'story:line': {
        const story = this.chains.find((s) => s.editor === pid);
        if (!story) return;
        if (typeof data !== 'string') return;

        const line = Sanitize.str(data);
        if (line.length < 1 || line.length > 512) return;

        this.lastEdit[pid] = Date.now();
        story.addLink(pid, line);
        this.redistribute();
        break;
      }

      case 'story:done': {
        this.finishedReading[pid] = data === true;
        this.sendGameInfo();
        if (this.players.every((p) => this.finishedReading[p]))
          this.lobby.endGame();
        break;
      }

      case 'chain:react': {
        this.reactToChain(pid, data);
        break;
      }
    }
  }

  /**
   * Toggle a reaction on one finished chain. Shared by every chain game (Comic/Draw/Redacted all
   * inherit it) so the validation lives in exactly one place.
   */
  reactToChain(pid: string, data: unknown): void {
    // Reactions only mean anything once every chain is finished and on screen.
    if (this.getGameProgress() !== 1) return;
    const result = applyReaction(
      this.chains.map((c) => c.reactions),
      pid,
      data,
    );
    if (!result) return;
    // Only an ADD is announced: a removal has nothing to animate, and echoing it would fire a
    // float on every client for a reaction that is going away.
    if (result.added) {
      // pid rides along so the player who pressed can ignore their own echo - they already
      // animated optimistically, and playing it twice reads as a double-press.
      this.lobby.emitAll('game:reaction', {
        index: result.index,
        reaction: result.reaction,
        pid,
      });
    }
    this.sendGameInfo();
  }

  getGameProgress(): number {
    const { numStories, numLinks } = this.config;
    const totalLines = numStories * numLinks;
    const writtenLines = _.sumBy(this.chains, (s) => s.chain.length);
    return writtenLines / totalLines;
  }

  override getPlayerState(pid: string): PlayerState {
    const story = this.chains.find((s) => s.editor === pid);
    const done = this.getGameProgress() === 1;

    if (story) {
      return {
        id: pid,
        state: 'EDITING',
        isLastLink: story.chain.length === this.config.numLinks - 1,
        link: story.chain.slice(-this.config.contextLen),
      } as PlayerState;
    }
    return {
      id: pid,
      reacted: reactionFlags(
        this.chains.map((c) => c.reactions),
        pid,
      ),
      state: done ? 'READING' : 'WAITING',
    } as PlayerState;
  }

  compileStories(): Array<Array<{ link: unknown; editor: string }>> {
    if (!this.compiled)
      this.compiled = this.chains.map((s) =>
        _.zip(s.chain, s.editors).map(([link, e]) => ({
          link,
          editor: this.config.anonymous ? '' : (e ?? ''),
        })),
      );
    return this.compiled;
  }

  override getState(): GameState {
    const hasStory: Record<string, boolean> = {};
    for (const c of this.chains.filter((s) => s.editor))
      hasStory[c.editor] = true;
    const progress = this.getGameProgress();
    return {
      icons: Object.fromEntries(
        this.players.map((p) => [
          p,
          progress === 1
            ? this.finishedReading[p]
              ? 'check'
              : 'clock'
            : hasStory[p]
              ? 'pencil'
              : 'clock',
        ]),
      ),
      progress,
      reactions: countReactions(this.chains.map((c) => c.reactions)),
      isComplete: progress === 1,
    };
  }
}

import { Story } from './story.js';
import * as Sanitize from './util/Sanitize.js';
import type { Lobby } from '../Lobby.js';
import type { ResolvedGameConfig } from './game.js';
import type { GameState } from '@shared/types';
import type { GameMessageType } from '@shared/events';
import { countReactions } from './util/reactions.js';
import { isDrawingId, exists as drawingExists } from '../Drawings.js';

export class Draw extends Story {
  constructor(lobby: Lobby, config: ResolvedGameConfig, players: string[]) {
    super(lobby, config, players);
    this.config.contextLen = 1;
    this.config.numStories = config.players;
    // Make the number of links odd
    this.config.numLinks -= (this.config.numLinks - 1) % 2;
    // Make sure the same player does not edit the chain until others had a chance
    this.clearance = config.players - 1;
  }

  /**
   * Blank any drawing a restored save carries that is not a valid image.
   *
   * A lobby persisted before drawings became images holds the old Paper.js vector arrays, which no
   * renderer understands. Scrubbing once here means getPlayerState / compileStories / results never
   * have to re-check, and a legacy link renders as a blank frame instead of breaking the screen.
   *
   * Only the id SHAPE is checked, not whether the file is still on disk: drawings and saves expire
   * on the same schedule, and blanking a link because of a transient read failure would be worse
   * than letting the image 404 into an empty frame.
   */
  override restore(blob: unknown): void {
    super.restore(blob);
    for (const chain of this.chains) {
      chain.chain = chain.chain.map((link: { type?: string; data?: unknown }) =>
        link?.type === 'image' && !isDrawingId(link.data)
          ? { type: 'image', data: '' }
          : link,
      );
    }
  }

  override handleMessage(pid: string, type: GameMessageType, data: unknown): void {
    const chain = this.chains.find((s) => s.editor === pid);
    const expectedType =
      chain && chain.chain.length % 2 === 0 ? 'desc' : 'image';

    switch (type) {
      case 'draw:result': {
        if (this.getGameProgress() === 1) {
          this.emitTo(pid, 'draw:result', this.compileStories());
        }
        break;
      }

      case 'draw:image': {
        if (!chain || expectedType !== 'image') return;
        // The bytes were validated (format, size, resolution) when they were uploaded to
        // /api/v1/drawing; all that travels here is the id, which must name a drawing that really
        // exists so a client cannot inject a dangling reference every other player renders as a hole.
        if (!isDrawingId(data) || !drawingExists(data)) return;

        chain.addLink(pid, { type: 'image', data });
        this.lastEdit[pid] = Date.now();
        this.redistribute();
        break;
      }

      case 'draw:desc': {
        if (!chain || expectedType !== 'desc') return;
        if (typeof data !== 'string') return;

        const line = Sanitize.str(data);
        if (line.length < 1 || line.length > 256) return;

        this.lastEdit[pid] = Date.now();
        chain.addLink(pid, { type: 'desc', data: line });
        this.redistribute();
        break;
      }

      case 'draw:done': {
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

  override getState(): GameState {
    const hasChain: Record<string, string> = {};
    for (const c of this.chains.filter((s) => s.editor))
      hasChain[c.editor] = c.chain.length % 2 === 0 ? 'pencil' : 'paint brush';

    const progress = this.getGameProgress();
    return {
      icons: Object.fromEntries(
        this.players.map((p) => [
          p,
          progress === 1
            ? this.finishedReading[p]
              ? 'check'
              : 'clock'
            : hasChain[p] || 'clock',
        ]),
      ),
      progress,
      timeLimit: this.config.timeLimit,
      colors: this.config.colors,
      reactions: countReactions(this.chains.map((c) => c.reactions)),
      isComplete: progress === 1,
    } as GameState;
  }
}

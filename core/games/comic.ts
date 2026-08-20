import { Story } from './story.js';
import * as Sanitize from './util/Sanitize.js';
import type { Lobby } from '../Lobby.js';
import type { ResolvedGameConfig } from './game.js';
import type { GameState, PlayerState } from '@shared/types';
import type { GameMessageType } from '@shared/events';
import { countReactions, reactionFlags } from './util/reactions.js';
import { isDrawingId, exists as drawingExists } from '../Drawings.js';

type ComicMessageData = { drawing?: unknown; caption?: unknown };

/**
 * A save written before drawings became images holds the old Paper.js vector payload, which no
 * renderer understands any more. Blank it rather than shipping an unrenderable link to clients.
 */
const safeDrawing = (value: unknown): string => (isDrawingId(value) ? value : '');

export class Comic extends Story {
  enableCaptions: boolean;
  showCaptions: boolean;
  showDrawings: boolean;

  constructor(lobby: Lobby, config: ResolvedGameConfig, players: string[]) {
    super(lobby, config, players);
    this.config.contextLen = 1;
    this.config.numStories = config.numPieces;

    this.enableCaptions = !!config.gamemode.captions;
    this.showCaptions = this.enableCaptions && !!config.gamemode.show_captions;
    this.showDrawings = !!config.gamemode.show_drawings;

    // Make sure the same player does not edit the chain until others had a chance
    this.clearance = config.players - 1;
  }

  /**
   * Blank any drawing a restored save carries that is not a valid image. Scrubbing once here means
   * getPlayerState / compileStories never have to re-check; see `safeDrawing`.
   */
  override restore(blob: unknown): void {
    super.restore(blob);
    for (const chain of this.chains) {
      chain.chain = chain.chain.map((link: { drawing?: unknown; caption?: string }) => ({
        ...link,
        drawing: safeDrawing(link?.drawing),
      }));
    }
  }

  override handleMessage(pid: string, type: GameMessageType, data: unknown): void {
    let drawing = '';
    let caption: string | undefined;

    // sanitize / validate the drawing payload
    if (type === 'comic:line') {
      if (typeof data !== 'object' || data === null) return;
      const d = data as ComicMessageData;
      const keys = Object.keys(d);
      if (keys.length > 2 || keys.length < 1) return;

      if (!this.enableCaptions && d.caption) return;

      // The bytes were validated on upload to /api/v1/drawing; only the id travels here, and it
      // must name a drawing that really exists. This runs before the editor check, so any member
      // (even a spectator) can reach it - it must only ever no-op on bad input, never throw, or
      // `Lobby.attempt` would catch it and END THE GAME.
      if (!isDrawingId(d.drawing) || !drawingExists(d.drawing)) return;
      drawing = d.drawing;

      if (this.enableCaptions) {
        if (typeof d.caption !== 'string') return;
        const line = Sanitize.str(d.caption);
        if (line.length < 1 || line.length > 256) return;
        caption = line;
      }
    }

    switch (type) {
      case 'comic:result': {
        if (this.getGameProgress() === 1) {
          this.emitTo(pid, 'comic:result', this.compileStories());
        }
        break;
      }

      case 'comic:line': {
        const story = this.chains.find((s) => s.editor === pid);
        if (!story) return;

        this.lastEdit[pid] = Date.now();
        story.addLink(pid, { drawing, caption });
        this.redistribute();
        break;
      }

      case 'comic:done': {
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

  override getPlayerState(pid: string): PlayerState {
    const story = this.chains.find((s) => s.editor === pid);

    if (story) {
      const myLink = story.chain.slice(-this.config.contextLen);
      return {
        id: pid,
        state: 'EDITING',
        isLastLink: story.chain.length === this.config.numLinks - 1,
        link: myLink.map((l: { drawing?: unknown; caption?: string }) => ({
          drawing: this.showDrawings ? safeDrawing(l.drawing) : '',
          caption: this.showCaptions ? l.caption : '',
        })),
      } as PlayerState;
    }

    return {
      id: pid,
      reacted: reactionFlags(
        this.chains.map((c) => c.reactions),
        pid,
      ),
      state: this.getGameProgress() === 1 ? 'READING' : 'WAITING',
    } as PlayerState;
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
              ? 'paint brush'
              : 'clock',
        ]),
      ),
      progress,
      colors: this.config.colors,
      continuous: this.config.gamemode.continuous,
      enableCaptions: this.enableCaptions,
      showCaptions: this.showCaptions,
      showDrawings: this.showDrawings,
      reactions: countReactions(this.chains.map((c) => c.reactions)),
      isComplete: progress === 1,
    } as GameState;
  }
}

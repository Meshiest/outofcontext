import { emptyReactions, type ReactionBuckets } from './reactions.js';

export type ChainReactions = ReactionBuckets;

// Serialized form of a Chain (produced by save(), consumed by restore()).
export interface ChainSaveBlob<T = unknown> {
  version: 1;
  numPlayers: number;
  collaborators: Record<string, number>;
  lastEditor: string;
  editor: string;
  chain: T[];
  type?: string;
  editors: string[];
  reactions: ChainReactions;
  /** Pre-reactions saves stored a single like flag per player; read for migration only. */
  likes?: Record<string, boolean>;
}


// A chain is the core collaborative data structure: an ordered list of links edited by rotating
// players. `T` is the shape of a single link, which differs per game (a string for Story, a drawing
// object for Comic, a tagged union for Redacted, etc.).
export class Chain<T = unknown> {
  numPlayers: number;
  // How many times each player has contributed.
  collaborators: Record<string, number>;
  // Id of the previous editor.
  lastEditor: string;
  // Id of the current editor ('' when nobody is assigned).
  editor: string;
  chain: T[];
  // Editor id per link (parallel to `chain`).
  editors: string[];
  // Who reacted to this chain, per reaction. At most one of each reaction per player.
  reactions: ChainReactions;
  // Chain category (Recipe assigns 'step' | 'ingredient' | 'comment').
  type?: string;
  // Recipe assigns theme/themeEditor dynamically for 'step' chains.
  theme?: string;
  themeEditor?: string;

  constructor(numPlayers: number, _length?: number) {
    this.numPlayers = numPlayers;
    this.collaborators = {};
    this.lastEditor = '';
    this.editor = '';
    this.chain = [];
    this.editors = [];
    this.reactions = emptyReactions();
  }

  save(): ChainSaveBlob<T> {
    return {
      version: 1,
      numPlayers: this.numPlayers,
      collaborators: this.collaborators,
      lastEditor: this.lastEditor,
      editor: this.editor,
      chain: this.chain,
      type: this.type,
      editors: this.editors,
      reactions: this.reactions,
    };
  }

  /**
   * Rebuild from a save blob.
   *
   * Every field is defaulted rather than trusted. The blob is JSON read off disk, so its shape is
   * an assumption the type system cannot enforce - and a missing field does not fail here, it fails
   * later and somewhere else entirely: an absent `collaborators` reached production as
   * "Cannot read property '<playerId>' of undefined" thrown from a game's message handler, several
   * interactions after the restore that actually caused it.
   */
  restore(blob: ChainSaveBlob<T>): void {
    if (blob.version !== 1) return;

    this.collaborators = blob.collaborators ?? {};
    this.lastEditor = blob.lastEditor ?? '';
    this.editor = blob.editor ?? '';
    this.chain = blob.chain ?? [];
    this.editors = blob.editors ?? [];
    // A save written before reactions existed carries `likes`; those were hearts.
    this.reactions = blob.reactions ?? { ...emptyReactions(), heart: blob.likes ?? {} };
    this.type = blob.type;
  }

  avgEdits(): number {
    // Guarded for the same reason restore() defaults its fields: a blob without `numPlayers` makes
    // this NaN, and every comparison against NaN is false - so redistribute's "under-contributed"
    // filter would quietly admit nobody and the round would stall with no editor anywhere.
    if (!(this.numPlayers > 0)) return 0;
    const total = Object.values(this.collaborators).reduce((a, b) => a + b, 0);
    return total / this.numPlayers;
  }

  addLink(pid: string, link: T): void {
    this.lastEditor = this.editor;
    if (pid) this.collaborators[pid] = (this.collaborators[pid] || 0) + 1;
    this.chain.push(link);
    this.editors.push(pid);
    this.editor = '';
  }

  // Rebuild a chain from serialized save data.
  static restore<T = unknown>(blob: ChainSaveBlob<T>): Chain<T> {
    const c = new Chain<T>(blob.numPlayers ?? 0);
    c.restore(blob);
    return c;
  }
}

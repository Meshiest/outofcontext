import _ from 'lodash';
import { Story } from './story.js';
import * as Sanitize from './util/Sanitize.js';
import { Chain } from './util/Chain.js';
import type { GameState, PlayerState } from '@shared/types';
import type { GameMessageType } from '@shared/events';
import {
  applyReaction,
  countReactions,
  emptyReactions,
  reactionFlags,
  type ReactionBuckets,
} from './util/reactions.js';

const HOTWORDRAND = /ITEM#?R/g;
const HOTWORDNUM = /ITEM#?\d{1,3}/g;
const HOTWORD = /ITEM/g;

function parseItem(str: string, i: number, items: string[]): string {
  return str
    .replace(HOTWORDRAND, () => _.sample(items) as string) // random replacement
    .replace(HOTWORDNUM, (m) => {
      // specific replacement
      const parsed = parseInt(m.match(/\d+/)?.[0] ?? '0', 10) - 1;
      const val = _.clamp(parsed, 0, items.length - 1);
      return items[val];
    })
    .replace(HOTWORD, items[i]); // default replacement
}

export class Recipe extends Story {
  // Recipes are assembled from three chains each, so reactions are tracked per RECIPE here rather
  // than on the chains the way the other chain games do.
  recipeReactions: ReactionBuckets[] = [];

  // Find a chain for a player to work on (recipe has step/ingredient/comment chains).
  override findChainForPlayer(player: string): Chain<any> | undefined {
    const { numSteps } = this.config;

    const fullChains = this.chains
      .filter((c) => c.type !== 'comment')
      .every((c) => c.chain.length === numSteps);

    if (fullChains) return undefined;

    const [comments, chains] = _.chain(this.chains)
      .filter((c) => !c.editor) // not being edited
      .filter((c) => c.lastEditor !== player) // not just edited by this player
      .filter((c) => (c.collaborators[player] || 0) <= c.avgEdits()) // under-contributed
      .sortBy((c) => c.chain.length) // shortest first
      .partition((c) => c.type === 'comment') // comments vs steps/ingredients
      .value() as [Chain<any>[], Chain<any>[]];

    const available = _.chain(chains)
      .filter((c) => c.chain.length < numSteps)
      .sortBy((c) => !(c.type === 'step' && !c.theme))
      .value();

    // First available ingredient or step, else the first available comment
    return available[0] || comments[0];
  }

  override start(): void {
    const numPlayers = this.players.length;
    const { numRecipes, numSteps } = this.config;

    // Create chains for each recipe (3 kinds per recipe)
    this.chains = _.range(numRecipes * 3).map(
      () => new Chain(numPlayers, numSteps),
    );

    this.recipeReactions = _.range(numRecipes).map(() => emptyReactions());

    this.chains.forEach((chain, i) => {
      chain.type = ['step', 'ingredient', 'comment'][i % 3];
    });

    // Every player has an equal chance of getting a chain
    const players = _.shuffle(this.players);
    for (const player of players) {
      const story = this.findChainForPlayer(player);
      if (!story) break;
      story.editor = player;
    }

    this.sendGameInfo();
  }

  override handleMessage(pid: string, type: GameMessageType, data: unknown): void {
    const chain = this.chains.find((c) => c.editor === pid);
    const noEditors = !this.chains.some((c) => c.editor);
    let line: string;

    switch (type) {
      case 'recipe:result': {
        if (this.compiled) {
          this.emitTo(pid, 'recipe:result', this.compiled);
        }
        break;
      }

      case 'recipe:theme': {
        if (!chain) return;
        if (chain.type !== 'step' || chain.theme) return;
        if (typeof data !== 'string') return;

        line = Sanitize.str(data);
        if (line.length < 1 || line.length > 256) return;

        this.lastEdit[pid] = Date.now();
        chain.lastEditor = pid;
        chain.themeEditor = pid;
        chain.theme = line;
        chain.editor = '';
        chain.collaborators[pid] = (chain.collaborators[pid] || 0) + 1;

        this.redistribute();
        break;
      }

      case 'recipe:line': {
        if (!chain) return;
        if (chain.type === 'step' && !chain.theme) return;
        if (typeof data !== 'string') return;

        line = Sanitize.str(data);
        if (chain.type === 'step' && !line.match(HOTWORD)) return;
        if (line.length < 1 || line.length > 256) return;

        this.lastEdit[pid] = Date.now();
        chain.addLink(pid, line);
        this.redistribute();
        break;
      }

      case 'recipe:done': {
        this.finishedReading[pid] = data === true;
        this.sendGameInfo();
        if (this.players.every((p) => this.finishedReading[p]))
          this.lobby.endGame();
        break;
      }

      case 'chain:react': {
        // A recipe is only reactable once every chain is done AND nobody still holds one.
        if (this.getGameProgress() !== 1 || !noEditors) break;
        const result = applyReaction(this.recipeReactions, pid, data);
        if (!result) break;
        if (result.added) {
          this.lobby.emitAll('game:reaction', {
            index: result.index,
            reaction: result.reaction,
            pid,
          });
        }
        this.sendGameInfo();
        break;
      }
    }
  }

  override restore(blob: unknown): void {
    const b = blob as {
      version: number;
      chains: ReturnType<Chain['save']>[];
      finishedReading: Record<string, boolean>;
      compiled?: unknown;
    };
    if (b.version !== 1 && b.version !== 2) return;

    this.chains = b.chains.map((c) => Chain.restore(c));
    this.finishedReading = b.finishedReading;
    this.compiled = b.compiled;
  }

  override save(): unknown {
    return {
      version: 2,
      chains: this.chains.map((s) => s.save()),
      finishedReading: this.finishedReading,
      compiled: this.compiled,
    };
  }

  /** A recipe also needs its comment pass done, so progress alone is not the end of play. */
  override isFinished(): boolean {
    return this.getGameProgress() === 1 && !this.chains.some((s) => s.editor);
  }

  override getGameProgress(): number {
    const { numRecipes, numSteps } = this.config;
    const totalLines = numRecipes * numSteps * 2;
    const writtenLines = _.chain(this.chains)
      .filter((c) => c.type !== 'comment')
      .sumBy((c) => c.chain.length)
      .value();
    return writtenLines / totalLines;
  }

  override getPlayerState(pid: string): PlayerState {
    const { numSteps } = this.config;
    const chain = this.chains.find((s) => s.editor === pid);
    const noEditors = !this.chains.some((s) => s.editor);
    const done = this.getGameProgress() === 1 && noEditors;

    if (chain) {
      return {
        id: pid,
        state: 'EDITING',
        link:
          chain.type === 'step'
            ? !chain.theme
              ? { type: 'theme' }
              : {
                  type: 'step',
                  theme: chain.theme,
                  index: chain.chain.length + 1,
                  total: numSteps,
                }
            : chain.type === 'ingredient'
              ? { type: 'ingredient', ingredients: chain.chain }
              : chain.type === 'comment'
                ? { type: 'comment', comments: chain.chain }
                : { type: null },
      } as PlayerState;
    }

    return {
      id: pid,
      reacted: reactionFlags(this.recipeReactions, pid),
      state: done ? 'READING' : 'WAITING',
    } as PlayerState;
  }

  compileRecipes(): unknown {
    const grouped = _.chain(this.chains).shuffle().groupBy('type').value();
    const comment = grouped.comment;
    const step = grouped.step;
    const ingredient = grouped.ingredient;

    // Shuffle ingredients together with their editors
    ingredient.forEach((ing) => {
      const [editors, chain] = _.chain(ing.editors)
        .zip(ing.chain)
        .shuffle()
        .unzip()
        .value() as [string[], any[]];
      ing.editors = editors;
      ing.chain = chain;
    });

    return step.map((s, i) => ({
      theme: s.theme,
      author: this.config.anonymous ? '' : s.themeEditor,
      steps: _.zip(s.chain, ingredient[i].chain, s.editors, ingredient[i].editors).map(
        ([instr, , editor, helper], j) => ({
          link: parseItem(instr as string, j, ingredient[i].chain),
          editors: this.config.anonymous ? ['', ''] : [editor, helper],
        }),
      ),
      comments: _.zip(comment[i].chain, comment[i].editors).map(([link, e]) => ({
        link: parseItem(
          link as string,
          _.random(ingredient[i].chain.length - 1),
          ingredient[i].chain,
        ),
        editor: this.config.anonymous ? '' : e,
      })),
    }));
  }

  override getState(): GameState {
    const hasRecipe = this.chains
      .filter((s) => s.editor)
      .reduce(
        (obj, i) => ({ ...obj, [i.editor]: i }),
        {} as Record<string, Chain<any>>,
      );
    const progress = this.getGameProgress();
    const noEditors = !this.chains.some((s) => s.editor);
    this.compiled =
      this.compiled || (progress === 1 && noEditors && this.compileRecipes());

    return {
      icons: this.players.reduce(
        (obj, p) => {
          let icon: string;
          if (progress === 1 && noEditors) {
            icon = this.finishedReading[p] ? 'check' : 'clock';
          } else {
            const rec = hasRecipe[p];
            const typeIcons: Record<string, string> = {
              wait: 'clock',
              step: rec && !rec.theme ? 'lightbulb' : 'pencil',
              ingredient: 'shopping basket',
              comment: 'comment',
            };
            const key = rec ? (rec.type ?? 'wait') : 'wait';
            icon = typeIcons[key] ?? 'clock';
          }
          return { ...obj, [p]: icon };
        },
        {} as Record<string, string>,
      ),
      progress,
      reactions: countReactions(this.recipeReactions),
      isComplete: progress === 1 && noEditors,
    } as GameState;
  }
}

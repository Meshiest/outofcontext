import _ from 'lodash';
import { Story } from './story.js';
import * as Sanitize from './util/Sanitize.js';
import * as Random from './util/Random.js';
import type { Lobby } from '../Lobby.js';
import type { ResolvedGameConfig } from './game.js';
import type { GameState, PlayerState } from '@shared/types';
import type { GameMessageType } from '@shared/events';
import { countReactions, reactionFlags } from './util/reactions.js';

// Built via fromCharCode so the source stays pure ASCII.
const APOS = String.fromCharCode(0x2019); // right single quotation mark
const ZWSP = String.fromCharCode(0x200b); // zero-width space, used as a censor delimiter
// Words: letters/marks/digits with internal apostrophes (straight/curly) and hyphens, i.e.
// /[\p{L}\p{M}\d]+(?:['-<curly-apos>-][\p{L}\p{M}\d]+)*/gu
const WORD_REGEX = new RegExp(
  '[\\p{L}\\p{M}\\d]+(?:[' + "'-" + APOS + '-][\\p{L}\\p{M}\\d]+)*',
  'gu',
);

export const COST = {
  truncate: 2,
  censor: 5,
};

export function getWords(str: string): RegExpMatchArray[] {
  return Array.from(str.matchAll(WORD_REGEX));
}

export class Redacted extends Story {
  autonomous: boolean;
  phases: string[];
  icons: Record<string, string>;

  constructor(lobby: Lobby, config: ResolvedGameConfig, players: string[]) {
    super(lobby, config, players);
    this.config.contextLen = 1;

    this.icons = {
      line: 'pencil',
      tamper: 'eraser',
      repair: 'redo',
    };

    const censor = config.gamemode.censor;
    const truncate = config.gamemode.truncate;

    // Autonomous mode means no human editing of the tamper/repair phases
    this.autonomous =
      (censor === 'random' || censor === 'none') &&
      (truncate === 'random' || truncate === 'none');

    this.phases = ['line', 'tamper', 'repair'];

    // Three phases (line -> tamper -> repair) per configured line. Guard with a persisted flag so a
    // save/restore cycle does not re-triple: saveState persists this MUTATED config, and reconstructing
    // from it would compound numLinks to *9, *27, ... -> progress never reaches 1 and the game never
    // ends. `linksTripled` is serialized with the config and short-circuits a second triple on restore.
    const cfg = this.config as ResolvedGameConfig & { linksTripled?: boolean };
    if (!cfg.linksTripled) {
      cfg.numLinks = config.numLinks * 3;
      cfg.linksTripled = true;
    }

    // Make sure the same player does not edit a chain he/she may already have seen
    this.clearance = 3;
  }

  override handleMessage(pid: string, type: GameMessageType, data: unknown): void {
    const chain = this.chains.find((s) => s.editor === pid);
    const expectedType = chain ? this.phases[chain.chain.length % 3] : undefined;
    const lastChain: any = chain ? _.last(chain.chain) : undefined;

    // number of words in the previous line (only meaningful during a tamper phase)
    const wordCount =
      expectedType === 'tamper' && lastChain
        ? getWords(lastChain.data).length
        : 0;
    const { ink, gamemode } = this.config;

    switch (type) {
      case 'redacted:result': {
        if (this.getGameProgress() === 1) {
          this.emitTo(pid, 'redacted:result', this.compileStories());
        }
        break;
      }

      case 'redacted:repair': {
        if (!chain || expectedType !== 'repair') return;

        if (lastChain.kind === 'truncate') {
          if (typeof data !== 'string') return;
          const line = Sanitize.str(data);
          if (line.length < 1 || line.length > 256 || getWords(line).length === 0)
            return;
          chain.addLink(pid, { type: 'repair', kind: 'truncate', data: line });
        } else if (lastChain.kind === 'censor') {
          if (
            !_.isArray(data) ||
            data.some(
              (d) =>
                !_.isArray(d) ||
                d.length !== 2 ||
                typeof d[0] !== 'number' ||
                typeof d[1] !== 'string',
            )
          )
            return;

          // the repair must have the same number of entries as the censor
          if (lastChain.data.indexes.length !== data.length) return;

          const cleaned = _.uniqBy(data, (d: any) => d[0]).map(
            ([i, s]: any) => [i, Sanitize.str(s)] as [number, string],
          );

          // every index must be one that was censored, and each word sufficiently short
          if (
            !cleaned.every(
              ([i, s]) =>
                lastChain.data.indexes.includes(i) &&
                s.length >= 1 &&
                s.length <= 32 &&
                getWords(s).length === 1,
            )
          )
            return;

          chain.addLink(pid, { type: 'repair', kind: 'censor', data: cleaned });
        } else {
          return;
        }

        this.lastEdit[pid] = Date.now();
        this.redistribute();
        break;
      }

      case 'redacted:truncate': {
        if (!chain || expectedType !== 'tamper' || gamemode.truncate !== 'player')
          return;

        // limit truncating to at most half the line
        if (typeof data !== 'number' || data < 1 || data > Math.ceil(wordCount / 2))
          return;

        // limit ink usage
        if (data * COST.truncate > ink) return;

        const lineStr: string = lastChain.data;
        const prevLine = getWords(lineStr);
        const end = prevLine[prevLine.length - data];
        if (!end) return;
        const endIndex = end.index ?? 0;

        chain.addLink(pid, {
          type: 'tamper',
          kind: 'truncate',
          data: {
            line: lineStr.slice(0, endIndex),
            length: lineStr.length - endIndex,
            count: data,
          },
        });

        this.lastEdit[pid] = Date.now();
        this.redistribute();
        break;
      }

      case 'redacted:censor': {
        if (!chain || expectedType !== 'tamper' || gamemode.censor !== 'player')
          return;

        if (!_.isArray(data)) return;

        const idxs = _.uniq(data) as number[];
        if (idxs.length < 1) return;

        // indexes must be integers within the word count
        if (
          idxs.some(
            (d) => typeof d !== 'number' || d < 0 || d >= wordCount || Math.floor(d) !== d,
          )
        )
          return;

        // can't use too much ink or censor over half the words
        if (idxs.length * COST.censor > ink || idxs.length > Math.ceil(wordCount / 2))
          return;

        const lineStr: string = lastChain.data;
        const words = getWords(lineStr).map((w) => w[0].length);
        let i = 0;

        const lineParts = lineStr
          .replace(WORD_REGEX, (s) => (idxs.includes(i++) ? ZWSP : s))
          .split(ZWSP)
          .map((s) => ({ type: 'string', value: s }));
        const lengths = idxs.map((d, k) => ({
          type: 'count',
          index: d,
          key: k,
          value: words[d],
        }));

        chain.addLink(pid, {
          type: 'tamper',
          kind: 'censor',
          data: {
            line: _.chain(lineParts)
              .zip(lengths)
              .flatten()
              .compact()
              .filter((f: any) => f.type !== 'string' || f.value)
              .value(),
            indexes: idxs,
          },
        });

        this.lastEdit[pid] = Date.now();
        this.redistribute();
        break;
      }

      case 'redacted:line': {
        if (!chain || expectedType !== 'line') return;
        if (typeof data !== 'string') return;

        const line = Sanitize.str(data);
        if (line.length < 1 || line.length > 256) return;

        this.lastEdit[pid] = Date.now();
        chain.addLink(pid, { type: 'line', data: line });

        if (this.autonomous) {
          const rng =
            gamemode.truncate === 'random' && gamemode.censor === 'random';

          if ((rng && Math.random() < 0.5) || gamemode.truncate === 'random') {
            // random truncate
            const low = 1;
            const high = Math.floor(ink / COST.truncate);
            const middle = (high + low) / 2;
            const range = (high - low) / 2;
            const count = Math.min(
              Math.max(low, Math.round(Random.gauss(range, middle))),
              high,
            );

            const prevLine = getWords(line);
            const end = prevLine[prevLine.length - count];
            const endIndex = end?.index ?? 0;

            chain.addLink('', {
              type: 'tamper',
              kind: 'truncate',
              data: {
                line: line.slice(0, endIndex),
                length: line.length - endIndex,
                count,
              },
            });
          } else {
            // random censor
            const low = 1;
            const high = Math.floor(ink / COST.censor);
            const middle = (high + low) / 2;
            const range = (high - low) / 2;

            const prevLine = getWords(line);
            const count = Math.min(
              Math.max(low, Math.round(Random.gauss(range, middle))),
              high,
            );
            const indexes = _.shuffle(_.range(prevLine.length)).slice(0, count);

            // NOTE: quirk - this is the match-array length, not the matched word's length
            const words = prevLine.map((w) => w.length);
            let i = 0;

            const newLineParts = line
              .replace(WORD_REGEX, (s) => (indexes.includes(i++) ? ZWSP : s))
              .split(ZWSP)
              .map((s) => ({ type: 'string', value: s }));
            const lengths = indexes.map((d, k) => ({
              type: 'count',
              index: d,
              key: k,
              value: words[d],
            }));

            chain.addLink('', {
              type: 'tamper',
              kind: 'censor',
              data: {
                line: _.chain(newLineParts)
                  .zip(lengths)
                  .flatten()
                  .compact()
                  .filter((f: any) => f.type !== 'string' || f.value)
                  .value(),
                indexes,
              },
            });
          }
        }

        this.redistribute();
        break;
      }

      case 'redacted:done': {
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

  constructLine(corrupted: any, edits: any, stage = 0): any {
    if (stage > this.config.edits) {
      if (corrupted.kind === 'censor') {
        return {
          line: corrupted.data.line.map((l: any) =>
            l.type === 'count'
              ? {
                  type: 'word',
                  value: (edits.data.find((e: any) => e[0] === l.index) || [
                    0,
                    '',
                  ])[1],
                }
              : {
                  type: 'punctuation',
                  value: l.value,
                },
          ),
        };
      } else if (corrupted.kind === 'truncate') {
        return {
          line: [
            {
              type: 'punctuation',
              value: corrupted.data.line,
            },
            {
              type: 'word',
              value: edits.data,
            },
          ],
        };
      } else {
        return { type: 'string', line: '' };
      }
    } else {
      if (corrupted.kind === 'censor') {
        return {
          line: [
            {
              type: 'punctuation',
              value: corrupted.data.line
                .map((l: any) =>
                  l.type === 'count'
                    ? (edits.data.find((e: any) => e[0] === l.index) || [
                        0,
                        '',
                      ])[1]
                    : l.value,
                )
                .join(''),
            },
          ],
        };
      } else if (corrupted.kind === 'truncate') {
        return {
          line: [
            {
              type: 'punctuation',
              value: corrupted.data.line + edits.data,
            },
          ],
        };
      } else {
        return { type: 'string', line: '' };
      }
    }
  }

  override compileStories(): any {
    if (!this.compiled)
      this.compiled = this.chains.map((s) =>
        _.chunk(_.zip(s.chain, s.editors), 3).map((group) => {
          const [first, second, third] = group;
          const author = first ? first[1] : undefined;
          const corrupted = second ? second[0] : undefined;
          const tamperer = second ? second[1] : undefined;
          const edits = third ? third[0] : undefined;
          const editor = third ? third[1] : undefined;
          return {
            data: this.constructLine(corrupted, edits, 2),
            editors: this.config.anonymous
              ? ['', '', '']
              : [author, tamperer, editor],
          };
        }),
      );
    return this.compiled;
  }

  override getPlayerState(pid: string): PlayerState {
    const story = this.chains.find((s) => s.editor === pid);
    const done = this.getGameProgress() === 1;

    if (story) {
      const link: any = story.chain.slice(-1)[0];
      const lastTwo = story.chain.slice(-2);
      return {
        id: pid,
        state: 'EDITING',
        isLastLink: story.chain.length >= this.config.numLinks - 3,
        link:
          link && link.type === 'repair'
            ? { ...link, data: this.constructLine(lastTwo[0], lastTwo[1], 1) }
            : link,
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

  override getState(): GameState {
    const hasChain = this.chains
      .filter((s) => s.editor)
      .reduce(
        (obj, i) => ({
          ...obj,
          [i.editor]: this.icons[this.phases[i.chain.length % 3]],
        }),
        {} as Record<string, string>,
      );

    const progress = this.getGameProgress();
    return {
      icons: this.players.reduce(
        (obj, p) => ({
          ...obj,
          [p]:
            progress === 1
              ? this.finishedReading[p]
                ? 'check'
                : 'clock'
              : hasChain[p] || 'clock',
        }),
        {} as Record<string, string>,
      ),
      progress,
      gamemode: this.config.gamemode,
      ink: this.config.ink,
      reactions: countReactions(this.chains.map((c) => c.reactions)),
      isComplete: progress === 1,
    } as GameState;
  }
}

import _ from 'lodash';
import fs from 'node:fs';
import { Game } from './game.js';
import type { PlayerState, GameState } from '@shared/types';
import type { GameMessageType } from '@shared/events';
import { loadWordList } from './util/wordLists.js';

function readDict(file: string): string[] {
  return String(
    fs.readFileSync(new URL(`./dicts/${file}`, import.meta.url)),
  ).split('\n');
}

const ANIMALS = readDict('animals.dict');
const COLORS = readDict('colors.dict');

interface AssassinSaveBlob {
  version: 1;
  title: string;
  words: Record<string, string[]>;
  targets: Record<string, string>;
  finishedLooking: Record<string, boolean>;
}

export class Assassin extends Game {
  words: Record<string, string[]> = {};
  targets: Record<string, string> = {};
  finishedLooking: Record<string, boolean> = {};
  title = '';

  start(): void {
    const { numWords } = this.config;
    const numPlayers = this.players.length;
    this.title = `${_.sample(COLORS)} ${_.sample(ANIMALS)}`;

    // Loaded per game rather than at module scope: which language the words come from is a lobby
    // setting, and the lists are cached inside loadWordList so this stays a map lookup after the
    // first game that uses one.
    const words = loadWordList(this.config.wordList);

    this.words = _.chain(words)
      .sampleSize(numWords * numPlayers) // grab enough for each player
      .chunk(numWords)
      .zip(this.players) // pair with a player
      .map(_.reverse) // put the player id first
      .fromPairs()
      .value() as Record<string, string[]>;

    const shuffled = _.shuffle(this.players);
    this.targets = shuffled.reduce(
      (obj, pid, i) => ({
        ...obj,
        [pid]: shuffled[(i + 1) % numPlayers],
      }),
      {} as Record<string, string>,
    );

    this.finishedLooking = {};

    this.sendGameInfo();
  }

  override restore(blob: unknown): void {
    const b = blob as AssassinSaveBlob;
    if (b.version !== 1) return;

    this.title = b.title;
    this.words = b.words;
    this.targets = b.targets;
    this.finishedLooking = b.finishedLooking;
  }

  override save(): AssassinSaveBlob {
    return {
      version: 1,
      title: this.title,
      words: this.words,
      targets: this.targets,
      finishedLooking: this.finishedLooking,
    };
  }

  override handleMessage(pid: string, type: GameMessageType, data: unknown): void {
    switch (type) {
      case 'assassin:done':
        this.finishedLooking[pid] = data === true;
        this.sendGameInfo();
        break;
    }
  }

  override getPlayerState(pid: string): PlayerState {
    const isBR = this.config.battleRoyale;
    return {
      id: pid,
      title: this.title,
      state: this.finishedLooking[pid] ? 'DONE' : 'READING',
      target: isBR || this.targets[pid],
      words: isBR || this.words[pid],
      targets:
        isBR &&
        this.players
          .filter((p) => p !== pid)
          .map((p) => ({ target: p, words: this.words[p] })),
    } as PlayerState;
  }

  override getState(): GameState {
    return {
      battleRoyale: this.config.battleRoyale,
      icons: this.players.reduce(
        (obj, p) => ({
          ...obj,
          [p]: this.finishedLooking[p] ? 'check' : 'clock',
        }),
        {} as Record<string, string>,
      ),
    } as GameState;
  }
}

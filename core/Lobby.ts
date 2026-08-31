import _ from 'lodash';
import gameInfo from '../gameInfo.js';
import * as Persistence from './Persistence.js';
import { Game } from './games/game.js';
import type { ResolvedGameConfig } from './games/game.js';
import { Story } from './games/story.js';
import { Comic } from './games/comic.js';
import { Draw } from './games/draw.js';
import { Assassin } from './games/assassin.js';
import { Redacted } from './games/redacted.js';
import { Recipe } from './games/recipe.js';
import type { Member } from './Member.js';
import { metrics, parseGameId } from './Metrics.js';
import type { Country, GameEndReason, GameConfigSettings } from './Metrics.js';
import type {
  GameMeta,
  LobbyInfo,
  LobbyState,
  MemberInfo,
  PlayerInfo,
} from '@shared/types';
import type { ServerEventName, GameMessageType } from '@shared/events';

// Raw (unresolved) config value: a number, an option-name string, or the '#numPlayers' sentinel.
export type ConfigValue = number | string;

// A player slot in a lobby. `id`/`member` become -1/null while the slot is disconnected.
export interface LobbyPlayer {
  /**
   * The member id holding this seat, or the NUMBER -1 when the seat is vacant - not the string
   * '-1'. The union makes `p.id === '-1'` typecheck while never matching, so compare against -1.
   */
  id: string | number;
  playerId: string;
  name: string;
  member: Member | null;
  connected: boolean;
}

export interface LobbySavePlayer {
  playerId: string;
  name: string;
}

// The serialized lobby shape produced by saveState() / consumed by restoreState().
export interface LobbySaveState {
  version?: number;
  code?: string;
  date?: string;
  lobbyState?: LobbyState;
  selectedGame?: string;
  gameConfig?: Record<string, ConfigValue>;
  players?: LobbySavePlayer[];
  game?: { config: ResolvedGameConfig; state: unknown } | null;
}

type GameConstructor = new (
  lobby: Lobby,
  config: ResolvedGameConfig,
  players: string[],
) => Game;

const CODE_LENGTH = 4;
const CODE_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');

const GAMES: Record<string, GameConstructor | undefined> = {
  story: Story,
  comic: Comic,
  draw: Draw,
  assassin: Assassin,
  redacted: Redacted,
  recipe: Recipe,
};

const metas = gameInfo as unknown as Record<string, GameMeta | undefined>;

function gameMeta(key: string): GameMeta | undefined {
  return metas[key];
}

export class Lobby {
  // list of in-memory lobbies
  static lobbies: Record<string, Lobby> = {};

  code!: string;
  created: number;
  members!: Member[];
  players!: LobbyPlayer[];
  spectators!: Array<{ id: string; name: string }>;
  selectedGame!: string;
  gameConfig!: Record<string, ConfigValue>;
  admin!: string;
  lobbyState!: LobbyState;
  game!: Game | null;
  /** When the running game started, for its duration metric. 0 when no game is running. */
  gameStartedAt = 0;
  persist = false;
  rocketcrab?: boolean;
  _saved?: boolean;

  // check if a lobby exists (in memory or on disk)
  static lobbyExists(code: string): boolean {
    return (
      (Object.prototype.hasOwnProperty.call(Lobby.lobbies, code) &&
        !!Lobby.lobbies[code]) ||
      Persistence.saveExists(code)
    );
  }

  static cull(code: string): void {
    const lobby = Lobby.lobbies[code];
    // A game still running when its lobby is culled was abandoned - everyone left mid-game. This
    // only reports it; endGame() is deliberately not called, because the lobby is going away.
    if (lobby?.game) lobby.reportGameEnded('abandoned');
    delete Lobby.lobbies[code];
  }

  // remove all empty, non-persistent lobbies older than 60 seconds.
  static cullEmpty(): number {
    let culled = 0;
    const now = Date.now();
    for (const [code, lobby] of Object.entries(Lobby.lobbies)) {
      if (!lobby) {
        Lobby.cull(code);
        continue;
      }
      // RocketCrab lobbies are created EMPTY and the player joins seconds later via the iframe, so a
      // 60s cull would expire the code before the handoff completes. Give them a longer (still bounded)
      // grace; a never-joined one is still reaped eventually.
      const emptyTtl = lobby.rocketcrab ? 30 * 60 * 1000 : 60000;
      if (lobby.empty() && !lobby.persist && now - lobby.created > emptyTtl) {
        Lobby.cull(code);
        ++culled;
      }
    }
    if (culled > 0) console.log(new Date(), '!- culled', culled, 'empty lobbies');
    return culled;
  }

  // generate a new, unused lobby code
  static newCode(prefix = ''): string {
    let code: string;
    let counter = 0;
    let length = CODE_LENGTH;
    do {
      // after 5 failed attempts, grow the code length (collisions should be astronomically rare)
      if (++counter > 5) {
        length++;
        counter = 0;
      }
      code = prefix + _.sampleSize(CODE_CHARS, length).join('');
    } while (Lobby.lobbyExists(code));
    return code;
  }

  static create(code: string, state?: LobbySaveState): Lobby {
    const lobby = new Lobby(state);
    lobby.code = code;
    Lobby.lobbies[code] = lobby;
    return lobby;
  }

  // remove a player from his/her lobby, saving/culling the lobby if it becomes empty
  static removePlayer(player: Member | undefined): void {
    if (!player) return;
    const lobby = player.lobby;
    if (!lobby) return;

    lobby.removeMember(player);
    player.lobby = undefined;

    if (lobby.empty()) {
      try {
        Persistence.saveLobbyState(lobby);
      } catch (err) {
        console.error(new Date(), 'error saving', lobby.code, err);
      }

      try {
        if (lobby.game) {
          lobby.game.stop();
          lobby.game.cleanup();
          lobby.game = null;
        }
        console.log(new Date(), `-- [lobby ${lobby.code}] removed`);
        Lobby.cull(lobby.code);
      } catch {
        // ignore cleanup errors
      }
    }
  }

  constructor(lobbyState?: LobbySaveState) {
    this.created = Date.now();
    try {
      if (typeof lobbyState !== 'undefined') {
        this.restoreState(lobbyState);
        return;
      }
    } catch (err) {
      console.error(new Date(), 'error restoring', lobbyState?.code, err);
    }
    this.resetLobby();
  }

  resetLobby(): void {
    if (typeof this.code === 'undefined') {
      this.code = Lobby.newCode();
    }
    this.members = [];
    this.players = [];
    this.spectators = [];
    this.selectedGame = '';
    this.gameConfig = { players: '#numPlayers' };
    this.admin = '';
    this.lobbyState = 'WAITING';
    this.game = null;
  }

  saveState(): LobbySaveState {
    return {
      version: 1,
      code: this.code,
      date: new Date().toString(),
      lobbyState: this.lobbyState,
      selectedGame: this.selectedGame,
      gameConfig: this.gameConfig,
      players: this.players.map((p) => ({
        playerId: p.playerId,
        name: p.member ? p.member.name : p.name,
      })),
      game: this.game
        ? {
            config: this.game.config,
            state: this.game.save(),
          }
        : null,
    };
  }

  restoreState(lobbyState: LobbySaveState): void {
    if (lobbyState.code) this.code = lobbyState.code;
    this.members = [];

    if (lobbyState.players) {
      this.players = lobbyState.players.map((p) => ({
        id: -1,
        playerId: p.playerId,
        connected: false,
        name: p.name,
        member: null,
      }));
    } else {
      this.players = [];
    }

    this.spectators = [];
    this.selectedGame = lobbyState.selectedGame || '';
    this.gameConfig =
      lobbyState.gameConfig ||
      (this.selectedGame
        ? _.mapValues(gameMeta(this.selectedGame)!.config, (v) => v.defaults)
        : { players: '#numPlayers' });

    this.admin = '';
    this.lobbyState = lobbyState.lobbyState || 'WAITING';

    if (lobbyState.game && this.players.length > 0) {
      const { config, state } = lobbyState.game;
      const Constructor = GAMES[this.selectedGame];
      if (Constructor) {
        this.game = new Constructor(
          this,
          config,
          this.players.map((p) => p.playerId),
        );
        this.game.restore(state);
        // cap players
        this.gameConfig.players = this.players.length;
      } else {
        this.game = null;
      }
    } else {
      this.game = null;
    }
  }

  // "safely" run a function; end the current game if it throws
  attempt<T>(fn: () => T): T | undefined {
    try {
      return fn();
    } catch (err) {
      console.log('Lobby Error', err);
      this.endGame('error');
      return undefined;
    }
  }

  startGame(): void {
    if (!this.selectedGame) return;

    const isPlayer: Record<string, boolean> = {};
    for (const p of this.players) isPlayer[String(p.id)] = true;
    for (const p of this.members) {
      if (!isPlayer[p.id]) {
        this.spectators.push({ id: p.id, name: p.name });
      }
    }

    // cap players
    this.gameConfig.players = this.players.length;

    const newConfig = this.configVals();
    if (!newConfig) return;

    const Constructor = GAMES[this.selectedGame];
    if (Constructor) {
      this.game = new Constructor(
        this,
        newConfig,
        this.players.map((p) => p.playerId),
      );
      this.lobbyState = 'PLAYING';
      this.updateMembers();
      this.sendLobbyInfo();
      this.game.start();
      this.gameStartedAt = Date.now();
      const gameId = parseGameId(this.selectedGame);
      if (gameId) {
        metrics.gameStarted({
          game: gameId,
          players: this.players.length,
          country: this.adminCountry(),
          participants: this.players.flatMap((p) =>
            p.member?.country ? [p.member.country] : [],
          ),
          rocketcrab: this.rocketcrab ?? false,
          config: this.configSettings(newConfig),
        });
      }
    }
  }

  /**
   * The settings this game is starting with. Choices come from the RAW gameConfig and numbers from
   * the RESOLVED one - see GameConfigSettings for why each side is the only one that works.
   *
   * `players` is skipped: ooc_game_players already reports the same number.
   */
  configSettings(resolved: ResolvedGameConfig): GameConfigSettings {
    const settings: GameConfigSettings = { choices: [], numbers: [] };
    const meta = gameMeta(this.selectedGame);
    if (!meta) return settings;

    for (const setting in this.gameConfig) {
      if (setting === 'players') continue;
      const info = meta.config[setting];
      if (!info) continue;

      if (info.type === 'int') {
        const value = (resolved as unknown as Record<string, unknown>)[setting];
        if (typeof value === 'number' && Number.isFinite(value)) {
          settings.numbers.push({ setting, value });
        }
      } else {
        settings.choices.push({ setting, value: String(this.gameConfig[setting]) });
      }
    }
    return settings;
  }

  /** The lobby admin's country - one per game, so a game counter labelled with it still sums. */
  adminCountry(): Country | undefined {
    return this.members.find((m) => m.id === this.admin)?.country;
  }

  /** Report a game ending exactly once, and clear the start time so it cannot be double-counted. */
  reportGameEnded(reason: GameEndReason): void {
    if (!this.gameStartedAt) return;
    const gameId = parseGameId(this.selectedGame);
    const durationMs = Date.now() - this.gameStartedAt;
    this.gameStartedAt = 0;
    if (gameId) {
      metrics.gameEnded({
        game: gameId,
        reason,
        country: this.adminCountry(),
        durationMs,
        rocketcrab: this.rocketcrab ?? false,
      });
    }
  }

  endGame(reason: GameEndReason = 'completed'): void {
    if (!this.selectedGame) return;
    if (this.lobbyState !== 'PLAYING') return;

    this.reportGameEnded(reason);

    if (this.game) {
      this.game.stop();
      this.game.cleanup();
    }

    this.game = null;
    this.lobbyState = 'WAITING';

    this.updateMembers();
    this.sendLobbyInfo();
  }

  setGame(game: string): void {
    if (this.lobbyState !== 'WAITING') return;

    const meta = gameMeta(game);
    if (meta) {
      this.selectedGame = game;
      this.gameConfig = _.mapValues(meta.config, (v) => v.defaults);
      this.updateMembers();
      this.sendLobbyInfo();
    }
  }

  gameMessage(member: string, type: GameMessageType, data: unknown): void {
    if (!this.game) return;
    const player = this.players.find((p) => p.id === member);
    if (player) {
      this.game.handleMessage(player.playerId, type, data);
    } else {
      this.game.handleMessage(member, type, data);
    }
  }

  setConfig(name: string, val: ConfigValue): void {
    if (this.lobbyState !== 'WAITING') return;
    if (!this.selectedGame) return;
    if (!Object.prototype.hasOwnProperty.call(this.gameConfig, name)) return;

    const meta = gameMeta(this.selectedGame);
    if (!meta) return;
    const conf = meta.config[name];
    if (!conf || conf.hidden) return;

    switch (conf.type) {
      case 'int': {
        let next: ConfigValue = val;
        if (typeof next !== 'number') {
          switch (next) {
            case '#numPlayers': {
              const max = meta.config.players.max ?? Infinity;
              if (this.players.length > max) next = max;
              break;
            }
            default:
              return;
          }
        } else {
          const max = conf.max;
          const min = conf.min ?? -Infinity;
          // Clamp to [min, max]: configVals rejects an out-of-range value, which makes startGame
          // silently no-op with no feedback to the user.
          next = Math.max(min, typeof max === 'number' ? Math.min(max, next) : next);
        }
        next = next === '#numPlayers' ? next : Math.floor(next as number);
        this.gameConfig[name] = next;
        break;
      }
      case 'bool':
        this.gameConfig[name] = val === 'true' ? 'true' : 'false';
        break;
      case 'list': {
        const entry = conf.options?.find((n) => n.name === val);
        this.gameConfig[name] = entry ? val : conf.defaults;
        break;
      }
    }

    this.updateMembers();
    this.sendLobbyInfo();
  }

  // resolve raw config into the values a game constructor expects, or false if invalid
  configVals(): ResolvedGameConfig | false {
    const conf: Record<string, unknown> = {};
    const numPlayers = this.players.length;
    const meta = gameMeta(this.selectedGame);
    if (!meta) return false;

    for (const name in this.gameConfig) {
      const info = meta.config[name];
      if (!info) continue;
      const rawVal = this.gameConfig[name];
      let val: unknown;
      switch (info.type) {
        case 'int': {
          if (rawVal === '#numPlayers') val = numPlayers;
          else val = Math.floor(Number(rawVal));
          const num = val as number;
          if ((info.min ?? -Infinity) > num || (info.max ?? Infinity) < num)
            return false;
          break;
        }
        case 'bool':
          val = rawVal === 'true';
          break;
        case 'list': {
          const opt = info.options?.find((o) => o.name === rawVal);
          if (!opt) return false;
          val = opt.value;
          break;
        }
      }
      conf[name] = val;
    }

    return conf as unknown as ResolvedGameConfig;
  }

  addMember(member: Member): void {
    this.members.push(member);
    this.updateMembers();
    this.sendLobbyInfo();
  }

  removeMember(member: Member): void {
    const i = this.members.indexOf(member);
    if (i >= 0) this.members.splice(i, 1);

    if (this.admin === member.id) this.admin = '';

    const playerObj = _.find(this.players, { id: member.id });
    if (playerObj) {
      playerObj.name = member.name;
      playerObj.connected = false;
      playerObj.member = null;
      playerObj.id = -1;
    }

    const isSpectator = this.spectators.find((p) => p.id === member.id);
    if (isSpectator) {
      this.spectators.splice(this.spectators.indexOf(isSpectator), 1);
    }

    // A player who leaves mid-game keeps their seat but must not keep their turn: the game hands
    // their work back to whoever is still here. Without this the round stalls on someone who is
    // never coming back to submit it.
    if (playerObj && this.lobbyState === 'PLAYING' && this.game) {
      this.attempt(() => this.game?.onPlayersChanged());
    }

    this.updateMembers();
    this.sendLobbyInfo();
  }

  empty(): boolean {
    return this.members.length === 0;
  }

  // emit a message to every member
  emitAll(event: ServerEventName, ...args: unknown[]): void {
    for (const m of this.members) m.send(event, ...args);
  }

  // emit a message to a specific player (by game-scoped playerId, falling back to member id)
  emitPlayer(id: string, event: ServerEventName, ...args: unknown[]): void {
    const player = this.players.find((p) => p.playerId === id);
    if (player && player.member) {
      player.member.send(event, ...args);
      return;
    }
    const member = this.members.find((p) => p.id === id);
    if (member) member.send(event, ...args);
  }

  /** The Cloudflare-resolved country of a seated player, for metric labelling. */
  countryOfPlayer(playerId: string): Country | undefined {
    return this.players.find((p) => p.playerId === playerId)?.member?.country;
  }

  // emit a message to a specific member (by member id)
  emitMember(id: string, event: ServerEventName, ...args: unknown[]): void {
    const member = this.members.find((p) => p.id === id);
    if (member) member.send(event, ...args);
  }

  // emit a message to every seated player
  emitPlayers(event: ServerEventName, ...args: unknown[]): void {
    for (const p of this.players) {
      if (p.member) p.member.send(event, ...args);
    }
  }

  // replace a player slot that has disconnected
  replacePlayer(member: Member, pid: string): void {
    const id = member.id;
    const isPlayer = this.players.find((p) => p.id === id);
    const isSpectator = this.spectators.find((p) => p.id === id);
    const targetPlayer = this.players.find(
      (p) => p.playerId === pid && p.id === -1 && !p.connected,
    );

    if ((!isPlayer || isSpectator) && targetPlayer && member.name) {
      targetPlayer.id = id;
      targetPlayer.name = member.name;
      targetPlayer.member = member;
      targetPlayer.connected = true;

      if (isSpectator) {
        this.spectators.splice(this.spectators.indexOf(isSpectator), 1);
      }

      this.updateMembers();

      // Back in the game: they are eligible for work again, so re-deal before telling them where
      // they stand - otherwise they sit on the waiting screen until somebody else finishes a turn.
      if (this.game && this.lobbyState === 'PLAYING') {
        this.attempt(() => this.game?.onPlayersChanged());
      }

      this.sendLobbyInfo();

      if (this.game && this.lobbyState === 'PLAYING') {
        member.send('game:info', this.game.getState());
        this.getPlayerState(id);
      }
    } else {
      member.send('game:player:info', { state: '' });
    }
  }

  getPlayerState(id: string): void {
    if (this.lobbyState !== 'PLAYING') return;
    if (!this.game) return;

    const player = this.players.find((p) => p.id === id);
    if (!player || !player.member) return;

    player.member.send(
      'game:player:info',
      this.game.getPlayerState(player.playerId),
    );
  }

  toggleSpectate(player: Member): void {
    if (!player.name) return;

    const isSpectator = this.spectators.find((p) => p.id === player.id);

    if (this.admin === player.id && !isSpectator) {
      this.admin = '';
    }

    if (isSpectator) {
      this.spectators.splice(this.spectators.indexOf(isSpectator), 1);
    } else {
      const playerObj = _.find(this.players, { id: player.id });
      if (playerObj) {
        playerObj.name = player.name;
        playerObj.connected = false;
        playerObj.member = null;
        playerObj.id = -1;
      }
      this.spectators.push({ id: player.id, name: player.name });
      player.send('game:player:info', { state: '' });
    }

    this.updateMembers();
    this.sendLobbyInfo();
  }

  updateMembers(): void {
    switch (this.lobbyState) {
      case 'WAITING': {
        // Cull disconnected players
        for (let i = 0; i < this.players.length; i++) {
          const p = this.players[i];
          if (!p.connected) {
            this.players.splice(i--, 1);
            continue;
          }
          // Move the admin to the front in case a later player gets culled
          if (p.id === this.admin) {
            this.players.splice(0, 0, ...this.players.splice(i, 1));
          }
        }

        // Remove players over the max player cap
        const cap = this.gameConfig.players;
        while (
          typeof cap === 'number' &&
          cap > 0 &&
          this.players.length > cap
        ) {
          const popped = this.players.pop();
          if (popped && this.admin === popped.id) this.admin = '';
        }

        // Add eligible members into the players list
        if (
          !cap ||
          cap === '#numPlayers' ||
          (typeof cap === 'number' && this.players.length < cap)
        ) {
          for (const m of this.members) {
            if (
              m.name &&
              !this.players.find((p) => p.id === m.id) &&
              !this.spectators.find((p) => p.id === m.id)
            ) {
              this.players.push({
                id: m.id,
                playerId: _.uniqueId('player'),
                name: m.name,
                member: m,
                connected: true,
              });
            }
          }
        }

        // Delegate a new admin
        for (let i = 0; !this.admin && i < this.players.length; i++) {
          if (this.players[i].connected) {
            this.admin = String(this.players[i].id);
          }
        }
        break;
      }

      case 'PLAYING': {
        // If the admin disconnected, clear it so a new one is delegated.
        const admin = this.players.find((p) => p.id === this.admin);
        if (admin && !admin.connected) this.admin = '';

        // Delegate a new admin
        for (let i = 0; !this.admin && i < this.players.length; i++) {
          if (this.players[i].connected) {
            this.admin = String(this.players[i].id);
          }
        }
        break;
      }
    }
  }

  // the current lobby state sent to players
  genLobbyInfo(): LobbyInfo {
    const isPlayer: Record<string, boolean> = {};
    for (const p of this.players) isPlayer[String(p.id)] = true;

    const info: LobbyInfo = {
      game: this.selectedGame,
      state: this.lobbyState,
      config: this.gameConfig,
      admin: this.admin,
      gameState: this.game ? this.game.getState() : { icons: {} },
      members: this.members.map(
        (m): MemberInfo => ({
          id: m.id,
          name: m.name || false,
        }),
      ),
      players: this.players.map(
        (p): PlayerInfo => ({
          id: p.id as unknown as string,
          playerId: p.playerId,
          connected: p.connected && !!p.member,
          name: p.member ? p.member.name : p.name,
        }),
      ),
      spectators: this.members
        .filter((m) => !isPlayer[m.id])
        .map((m) => ({ id: m.id, name: m.name })),
    };

    return info;
  }

  sendLobbyInfo(): void {
    this.emitAll('lobby:info', this.genLobbyInfo());
  }
}

// dev lobby
Lobby.create('devaaaa').persist = true;

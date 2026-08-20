import { Lobby } from '../core/Lobby.js';
import { Member } from '../core/Member.js';
import gameInfo from '../gameInfo.js';

// Aggregated server stats. All counts are for this instance only.
export interface ServerInfoResponse {
  clients: number;
  idleLobbies: number;
  idlePlayers: number;
  lobbies: number;
  lobbyPlayers: number;
  games: number;
  players: number;
  gameDistribution: Record<string, number>;
  playerDistribution: Record<string, number>;
  rocketcrabs: number;
}

export function computeServerInfo(): ServerInfoResponse {
  let lobbies = 0;
  let games = 0;
  let players = 0;
  let idleLobbies = 0;
  let idlePlayers = 0;
  let lobbyPlayers = 0;
  let rocketcrabs = 0;
  const gameDistribution: Record<string, number> = {};
  const playerDistribution: Record<string, number> = {};

  for (const c in Lobby.lobbies) {
    const l = Lobby.lobbies[c];

    if (l.members.length > 1) {
      if (l.rocketcrab) ++rocketcrabs;

      if (l.game) {
        if (!gameDistribution[l.selectedGame]) {
          gameDistribution[l.selectedGame] = 0;
          playerDistribution[l.selectedGame] = 0;
        }
        ++games;
        ++gameDistribution[l.selectedGame];
        playerDistribution[l.selectedGame] += l.members.length;
        players += l.members.length;
      } else {
        ++lobbies;
        lobbyPlayers += l.members.length;
      }
    } else {
      ++idleLobbies;
      idlePlayers += l.members.length;
    }
  }

  return {
    clients: Member.connectedCount(),
    idleLobbies,
    idlePlayers,
    lobbies,
    lobbyPlayers,
    games,
    players,
    gameDistribution,
    playerDistribution,
    rocketcrabs,
  };
}

export function gameExists(game: string): boolean {
  return Object.prototype.hasOwnProperty.call(gameInfo, game);
}

// Create an empty RocketCrab-prefixed lobby preset to a game; returns the code.
export function createRocketcrab(game: string): string {
  const code = Lobby.newCode('rc');
  const lobby = new Lobby();
  lobby.code = code;
  lobby.rocketcrab = true;
  lobby.setGame(game);
  Lobby.lobbies[code] = lobby;
  console.log(new Date(), `-- [${code}] created rocketcrab for ${game}`);
  return code;
}

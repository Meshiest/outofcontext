module.exports = class Game {
  constructor(lobby, config, players) {
    this.lobby = lobby;
    this.config = config;
    this.players = players;
  }

  // Emit a message to a specific player
  emitTo(pid, ...msg) {
    this.lobby.emitPlayer(pid, ...msg);
  }

  // Message all players
  emit(...msg) {
    this.lobby.emitPlayers(...msg);
  }

  // broadcast each player's state and 
  sendGameInfo() {
    this.lobby.emitAll('game:info', this.getState());
    for(const player of this.players) {
      this.emitTo(player, 'game:player:info', this.getPlayerState(player));
    }
  }

  // receive input from a player, potentially a spectator
  handleMessage(pid, type, data) {}

  // load a blob into game state
  restore(blob) {}

  // create a game state blob from the current game state
  save() {}

  // start the game
  start() {}

  // force stop the game
  stop() {}

  // clean up after game finishes
  cleanup() {}

  // player state given a player, spectators do not receive player state
  getPlayerState(pid) { return { state: '', id: pid }; }

  // overall game state
  getState() { return { icons: {} }; }
};

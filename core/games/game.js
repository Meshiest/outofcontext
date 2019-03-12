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

  sendGameInfo() {
    this.lobby.emitAll('game:info', this.getState());
    for(const player of this.players) {
      this.emitTo(player, 'game:player:info', this.getPlayerState(player));
    }
  }

  handleMessage(pid, type, data) {}
  start() {}
  stop() {}
  cleanup() {}
  getPlayerState(pid) { return { state: '', id: pid }; }
  getState() { return { icons: {} }; }
};

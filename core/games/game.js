module.exports = class Game {
  constructor(lobby, config, players) {
    this.lobby = lobby;
    this.config = config;
    this.players = players;
  }

  handleMessage(type, data) {}
  start() {}
  stop() {}
  cleanup() {}

  getState() {
    return {};
  }
};

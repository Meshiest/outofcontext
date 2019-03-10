const _ = require('lodash');

class Player {
  constructor(socket) {
    this.socket = socket;
    this.id = _.uniqueId('player');
    this.lobby = undefined;
    this.name = '';
    this.color = 0;
  }
}

module.exports = Player;
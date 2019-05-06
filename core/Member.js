const _ = require('lodash');

class Member {
  constructor(socket) {
    this.socket = socket;
    this.id = _.uniqueId('member');
    this.lobby = undefined;
    this.name = '';
    this.color = 0;
    this.lastEmote = Date.now();
  }

  isAdmin() {
     return this.lobby && this.lobby.admin === this.id;
  }
}

module.exports = Member;
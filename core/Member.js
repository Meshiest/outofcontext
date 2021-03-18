const _ = require('lodash');

// 1 hour of inactivity and not in game -> kick
const INACTIVE_DURATION = 60 * 60 * 1000;
// 4 hours of inactivity regardless -> kick
const REALLY_INACTIVE_DURATION = 4 * 60 * 60 * 1000;

const members = [];

class Member {
  static removePlayer(member) {
    if (member.removed) return;
    const index = members.indexOf(member);
    if (index < 0) return;
    members[index] = members[members.length - 1];
    members.pop();
  }

  static cullInactive() {
    const now = Date.now();
    for (let i = members.length - 1; i >= 0; --i) {
      const member = members[i];
      if (member.activity + INACTIVE_DURATION < now && !member.inActiveLobby() || member.activity + REALLY_INACTIVE_DURATION < now) {
        member.removed = true;
        console.log(new Date(), '-- [afk] disconnected inactive user');
        members[i] = members[members.length - 1];
        members.pop();
        if (member.socket.connected)
          member.socket.disconnect();
      }
    }
  }

  constructor(socket) {
    this.socket = socket;
    this.id = _.uniqueId('member');
    this.lobby = undefined;
    this.name = '';
    this.color = 0;
    this.lastEmote = Date.now();
    this.activity = Date.now();
    members.push(this);
  }

  interact() {
    this.activity = Date.now();
  }

  inActiveLobby() {
    return this.lobby && this.lobby.members.length > 1;
  }

  isAdmin() {
     return this.lobby && this.lobby.admin === this.id;
  }
}

module.exports = Member;
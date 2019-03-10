const _ = require('lodash');

class Lobby {
  constructor() {
    this.code = _.sampleSize('abcdefghijklmnopqrstuvwxyz', 4).join('');
    this.members = [];
    this.players = [];
    this.spectators = [];
    this.maxPlayers = 0;
  }

  addMember(member) {
    this.members.push(member);

    // TODO: announce a new member
  }

  removeMember(member) {
    const i = this.members.indexOf(member);
    if(i >= 0)
      this.members.splice(i, 1);

    // Remove the player from the current players
    const playerObj = _.find(this.players, {id: member.id});
    if(playerObj) {    
      playerObj.member = null;
      playerObj.id = -1;
    }

    // TODO: announce a removed member
  }

  /**
   * Determine if this lobby has any members
   * @return {boolean} True if there are no members
   */
  empty() {
    return this.members.length === 0;
  }

  /**
   * Emit a message to every member
   * @param  {args} args Arguments passed into emit
   */
  emitAll(...args) {
    for(const m of this.members) {
      m.socket.emit(...args);
    }
  }

  /**
   * Emit a message to every player
   * @param  {args} args Arguments passed into emit
   */
  emitPlayers(...args) {
    for(const p of this.players) {
      if(p.member)
        p.member.socket.emit(...args);
    }
  }
}

module.exports = Lobby;
const _ = require('lodash');
const gameInfo = require('../gameInfo');

class Lobby {
  constructor() {
    do {
      this.code = _.sampleSize('abcdefghijklmnopqrstuvwxyz0123456789', 4).join('');
    } while(Lobby.lobbies[this.code]);
    this.members = [];
    this.players = [];
    this.spectators = [];
    this.selectedGame = '';
    this.gameConfig = {players: '#numPlayers'};
    this.admin = '';
    this.lobbyState = 'WAITING';
  }

  setGame(game) {
    if(gameInfo.hasOwnProperty(game)) {
      this.selectedGame = game;
      this.gameConfig = _.mapValues(gameInfo[game].config, v => v.defaults);
      
      this.updateMembers();
      this.sendLobbyInfo();
    }
  }

  setConfig(name, val) {
    if(!this.selectedGame)
      return;

    if(!this.gameConfig.hasOwnProperty(name))
      return;

    const conf = gameInfo[this.selectedGame].config[name];

    switch(conf.type) {
    case 'int':
      if(typeof val !== 'number') {
        // value is not one of the calculated values
        switch(val) {
        case '#numPlayers':
          if(this.players.length > gameInfo[this.selectedGame].config.players.max)
            val = gameInfo[this.selectedGame].config.players.max;
          break;

        default:
          return
        }
      } else {
        // value is too small or too large
        if(val < conf.min || val > conf.max && conf.max) {
          return;
        }
      }

      this.gameConfig[name] = val;
    }

    this.updateMembers();
    this.sendLobbyInfo();
  }

  addMember(member) {
    this.members.push(member);
    this.updateMembers();
    this.sendLobbyInfo();
  }

  removeMember(member) {
    const i = this.members.indexOf(member);
    if(i >= 0)
      this.members.splice(i, 1);

    if(this.admin === member.id)
      this.admin = '';

    // Remove the player from the current players
    const playerObj = _.find(this.players, {id: member.id});
    if(playerObj) {
      playerObj.name = member.name;
      playerObj.connected = false;
      playerObj.member = null;
      playerObj.id = -1;
    }

    const isSpectator = this.spectators.find(p => p.id === player.id);
    if(isSpectator) {
      this.spectators.splice(this.spectators.indexOf(isSpectator), 1);
    }

    this.updateMembers();
    this.sendLobbyInfo();
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

  toggleSpectate(player) {
    const isSpectator = this.spectators.find(p => p.id === player.id);

    if(this.admin === player.id && !isSpectator)
      this.admin = '';
    if(isSpectator)
      this.spectators.splice(this.spectators.indexOf(isSpectator), 1);
    else
      this.spectators.push({id: player.id, name: player.name});

    this.updateMembers();
    this.sendLobbyInfo();
  }

  updateMembers() {
    switch(this.lobbyState) {
    case 'WAITING':
      for(let i = 0; i < this.players.length; i++) {
        const p = this.players[i];
        if(!p.connected) {
          this.players.splice(i--, 1);
        }
      }

      // Remove players who are over the max player cap
      while(this.gameConfig.players > 0 && this.players.length > this.gameConfig.players) {
        const [{id}] = this.players.splice(-1, 1);

        // Remove the admin if one of the removed players is the admin
        if(this.admin === id)
          this.admin = '';
      }

      // Determine if more members should be added into the players list
      if(!this.gameConfig.players || this.gameConfig.players === '#numPlayers' || this.players.length < this.gameConfig.players) {
        for(const m of this.members) {
          if(m.name && !this.players.find(p => p.id === m.id) && !this.spectators.find(p => p.id === m.id))
            this.players.push({
              id: m.id,
              name: m.name,
              member: m,
              connected: true,
            });
        }
      }

      // Delegate a new admin
      if(!this.admin && this.players.length)
        this.admin = this.players[0].id;
      break;
    }
  }

  sendLobbyInfo() {
    const isPlayer = this.players.reduce((obj, p) => ({...obj, [p.id]: true}), {});
    const info = {
      game: this.selectedGame,
      config: this.gameConfig,
      admin: this.admin,
      members: this.members.map(m => ({
        id: m.id,
        name: m.name || false,
      })),
      players: this.players.map(p => ({
        id: p.id,
        connected: !!p.member,
        name: p.member ? p.member.name : p.name,
      })),
      spectators: this.members.filter(m => !isPlayer[m.id]).map(m => ({
        id: m.id,
        name: m.name,
      })),
    };

    this.emitAll('lobby:info', info);
  }
}

Lobby.lobbies = {};

Lobby.lobbyExists = code =>
  Lobby.lobbies.hasOwnProperty(code) && Lobby.lobbies[code];

module.exports = Lobby;
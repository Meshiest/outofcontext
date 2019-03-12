const _ = require('lodash');
const gameInfo = require('../gameInfo');

const Story = require('./games/story');

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
    this.game = null;
  }

  // Start the game
  startGame() {
    if(!this.selectedGame) return;

    const isPlayer = this.players.reduce((obj, p) => ({...obj, [p.id]: true}), {});
    for(const p of this.members) {
      if(!isPlayer[p.id]) {
        this.spectators.push({id: p.id, name: p.name});
      }
    }

    let game;
    const numPlayers = this.players.length;

    // cap players
    this.gameConfig.players = numPlayers;

    // parse config values
    const newConfig = this.configVals();

    const args = [this, newConfig, this.players.map(p => p.playerId)];

    switch(this.selectedGame) {
      case 'story':
        game = new Story(...args);
        break;
      case 'draw':
      case 'assassin':
      case 'locations':
    }

    if(game) {
      this.game = game;
      this.lobbyState = 'PLAYING';
      this.updateMembers();
      this.sendLobbyInfo();
      this.game.start();
    }
  }

  // Change which game this lobby is playing
  setGame(game) {
    if(this.lobbyState !== 'WAITING') return;

    if(gameInfo.hasOwnProperty(game)) {
      this.selectedGame = game;
      this.gameConfig = _.mapValues(gameInfo[game].config, v => v.defaults);
      
      this.updateMembers();
      this.sendLobbyInfo();
    }
  }

  // Pass a message to the game controller
  gameMessage(member, type, data) {
    // find associated player
    const player = this.players.find(p => p.id === member);

    if(this.game && player) {
      this.game.handleMessage(player.playerId, type, data);
    }
  }

  // Change a value in the game config
  setConfig(name, val) {
    if(this.lobbyState !== 'WAITING') return;

    if(!this.selectedGame) return;

    if(!this.gameConfig.hasOwnProperty(name)) return;

    const conf = gameInfo[this.selectedGame].config[name];
    if(conf.hidden) return;

    // Type validation
    switch(conf.type) {
    case 'int':
      if(typeof val !== 'number') {
        // value is not one of the calculated values
        switch(val) {
        case '#numPlayers':
          if(this.players.length > gameInfo[this.selectedGame].config.players.max) {
            val = gameInfo[this.selectedGame].config.players.max;
          }
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
      break;
    case 'bool':
      this.gameConfig[name] = val === 'true' ? 'true' : 'false';
      break;
    case 'list':
      const entry = conf.options.find(n => n.name === val);
      this.gameConfig[name] = entry ? val : gameInfo[this.selectedGame].config[name].defaults;
      break;
    }

    this.updateMembers();
    this.sendLobbyInfo();
  }

  configVals() {
    const conf = {};
    const numPlayers = this.players.length;

    for(const name in this.gameConfig) {
      const info = gameInfo[this.selectedGame].config[name];
      const rawVal = this.gameConfig[name];
      let val;
      switch(info.type) {
      case 'int':
        if(rawVal === '#numPlayers')
          val = numPlayers;
        else
          val = rawVal;
        break;
      case 'bool':
        val = rawVal === 'true';
        break;
      case 'list':
        val = info.options.find(o => o.name === rawVal).value;
        break;
      }

      conf[name] = val;
    }

    return conf;
  }

  addMember(member) {
    this.members.push(member);
    this.updateMembers();
    this.sendLobbyInfo();
  }

  removeMember(member) {
    const i = this.members.indexOf(member);
    if(i >= 0) {
      this.members.splice(i, 1);
    }

    if(this.admin === member.id) {
      this.admin = '';
    }

    // Remove the player from the current players
    const playerObj = _.find(this.players, {id: member.id});
    if(playerObj) {
      playerObj.name = member.name;
      playerObj.connected = false;
      playerObj.member = null;
      playerObj.id = -1;
    }

    const isSpectator = this.spectators.find(p => p.id === member.id);
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
   * Emits a message to a specific player
   * @param  {string}    id   Player identifier
   * @param  {args} args Arguments passed to emit
   */
  emitPlayer(id, ...args) {
    const player = this.players.find(p => p.playerId === id);
    if(player && player.member) {
      player.member.socket.emit(...args);
    }
  }

  /**
   * Emits a message to a specific member
   * @param  {string}    id   Player identifier
   * @param  {args} args Arguments passed to emit
   */
  emitMember(id, ...args) {
    const player = this.members.find(p => p.id === id);
    if(player) {
      player.socket.emit(...args);
    }
  }

  /**
   * Emit a message to every player
   * @param  {args} args Arguments passed into emit
   */
  emitPlayers(...args) {
    for(const p of this.players) {
      if(p.member) {
        p.member.socket.emit(...args);
      }
    }
  }

  // Replace a player that has left the game
  replacePlayer(member, pid) {
    const id = member.id;
    const isPlayer = this.players.find(p => p.id === id);
    const isSpectator = this.spectators.find(p => p.id === id);
    const targetPlayer = this.players.find(p => p.playerId === pid && p.id === -1 && !p.connected);

    if((!isPlayer || isSpectator) && targetPlayer) {
      targetPlayer.id = id;
      targetPlayer.name = member.name;
      targetPlayer.member = member;
      targetPlayer.connected = true;


      this.updateMembers();
      this.sendLobbyInfo();

      if(this.game && this.lobbyState === 'PLAYING') {
        member.socket.emit('game:info', this.game.getState());
        this.getPlayerState(id);
      }
    } else {
      member.socket.emit('game:player:info', { state: '' });
    }
  }

  getPlayerState(id) {
    if(this.lobbyState !== 'PLAYING') {
      return;
    }

    const player = this.players.find(p => p.id === id);
    if(!player)
      return;

    player.member.socket.emit('game:player:info', this.game.getPlayerState(player.playerId));
  }

  // Swap a player into/out of spectators group
  toggleSpectate(player) {
    if(!player.name)
      return;

    const isSpectator = this.spectators.find(p => p.id === player.id);

    if(this.admin === player.id && !isSpectator) {
      this.admin = '';
    }

    if(isSpectator) {
      this.spectators.splice(this.spectators.indexOf(isSpectator), 1);
    } else {
      // Remove the player from the current players
      const playerObj = _.find(this.players, {id: player.id});
      if(playerObj) {
        playerObj.name = player.name;
        playerObj.connected = false;
        playerObj.member = undefined;
        playerObj.id = -1;
      }

      this.spectators.push({id: player.id, name: player.name});
      player.socket.emit('game:player:info', { state: '' });
    }

    this.updateMembers();
    this.sendLobbyInfo();
  }

  updateMembers() {
    switch(this.lobbyState) {
    case 'WAITING':
      // Cull disconnected players
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
        if(this.admin === id) {
          this.admin = '';
        }
      }

      // Determine if more members should be added into the players list
      if(!this.gameConfig.players || this.gameConfig.players === '#numPlayers' || this.players.length < this.gameConfig.players) {
        for(const m of this.members) {
          if(m.name && !this.players.find(p => p.id === m.id) && !this.spectators.find(p => p.id === m.id)) {
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
      for(let i = 0; !this.admin && i < this.players.length; i++) {
        if(this.players[i].connected) {
          this.admin = this.players[i].id;
        }
      }
      break;

    case 'PLAYING':

      // Determine if the admin disconnected
      const admin = this.players.find(p => p.id === this.admin);
      if(admin && !admin.connected)
        admin = '';

      // Delegate a new admin
      for(let i = 0; !this.admin && i < this.players.length; i++) {
        if(this.players[i].connected) {
          this.admin = this.players[i].id;
        }
      }
    }
  }

  genLobbyInfo() {
    const isPlayer = this.players.reduce((obj, p) => ({...obj, [p.id]: true}), {});
    const info = {
      game: this.selectedGame,
      state: this.lobbyState,
      config: this.gameConfig,
      admin: this.admin,
      gameState: this.game ? this.game.getState() : {}, 
      members: this.members.map(m => ({
        id: m.id,
        name: m.name || false,
      })),
      players: this.players.map(p => ({
        id: p.id,
        playerId: p.playerId,
        connected: p.connected && !!p.member,
        name: p.member ? p.member.name : p.name,
      })),
      spectators: this.members.filter(m => !isPlayer[m.id]).map(m => ({
        id: m.id,
        name: m.name,
      })),
    };

    return info;
  }

  sendLobbyInfo() {
    const info = this.genLobbyInfo();

    this.emitAll('lobby:info', info);
  }
}

Lobby.lobbies = {};

Lobby.lobbyExists = code =>
  Lobby.lobbies.hasOwnProperty(code) && Lobby.lobbies[code];

module.exports = Lobby;
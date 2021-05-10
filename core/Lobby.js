const _ = require('lodash');
const gameInfo = require('../gameInfo');
const Persistence = require('./Persistence');

const GAMES = {
  story: require('./games/story'),
  comic: require('./games/comic'),
  draw: require('./games/draw'),
  assassin: require('./games/assassin'),
  redacted: require('./games/redacted'),
  locations: require('./games/locations'),
  recipe: require('./games/recipe'),
};

const CODE_LENGTH = 4;

class Lobby {
  // list of in-memory lobbies
  static lobbies = {};
  // check if a lobby exists
  static lobbyExists(code) {
    return Lobby.lobbies.hasOwnProperty(code) && Lobby.lobbies[code] || Persistence.saveExists(code);
  }

  // remove a lobby from active lobbies structure
  static cull(code) {
    Lobby.lobbies[code] = false;
    delete Lobby.lobbies[code];
  }

  // remove all lobbies with no players
  static cullEmpty() {
    const now = Date.now();
    const keys = Object.keys(Lobby.lobbies);
    let count = 0, lobby;
    for (const code in keys) {
      lobby = Lobby.lobbies[code];
      // cleanup some garbage
      if (!lobby) {
        Lobby.cull(lobby);
        continue;
      }

      // delete empty, non-persist, lobbies that are older than 60 seconds
      if (lobby.empty() && !lobby.persist && now - lobby.created > 60000) {
        Lobby.cull(code);
        ++count;
      }
    }
    if (count > 0)
      console.log(new Date(), '!- culled', count, 'empty lobbies');
    return count;
  }

  // generate a new lobby code
  static newCode(prefix='') {
    let code, counter = 0, length = CODE_LENGTH;
    do {
      // after 5 failed attempts at creating a new lobby, increase the code length
      // this should be astronomically improbable so it's certainly due to collisions
      if (++counter > 5) {
        length ++;
        counter = 0;
      }

      code = prefix + _.sampleSize('abcdefghijklmnopqrstuvwxyz0123456789', length).join('');
    } while(Lobby.lobbyExists(code));
    return code;
  }

  // create a new lobby with a code
  static create(code, state) {
    const lobby = new Lobby(state);
    lobby.code = code;
    Lobby.lobbies[code] = lobby;
    return lobby;
  }

  /**
   * Removes player from his/her lobby
   * @param  {Member} player Player potentially in a lobby
   */
  static removePlayer(player) {
    if (!player) return;
    const lobby = player.lobby;

    if(!lobby) return;

    lobby.removeMember(player);
    player.lobby = undefined;

    if(lobby.empty()) {
      try {
        // save the lobby state
        Persistence.saveLobbyState(lobby);
      } catch (err) {
        // error saving lobby state
        console.error(new Date(), 'error saving', lobbyState.code, err);
      }

      try {
        // kill and cleanup the game
        if(lobby.game) {
          lobby.game.stop();
          lobby.game.cleanup();
          lobby.game = undefined;
        }

        console.log(new Date(), `-- [lobby ${lobby.code}] removed`);

        Lobby.cull(lobby.code);
      } catch (err) {
        //
      }
    }
  }

  constructor(lobbyState) {
    this.created = Date.now();
    // restore lobby from existing state
    try {
      if (typeof lobbyState !== 'undefined') {
        this.restoreState(lobbyState);
        return;
      }
    } catch (err) {
      // error restoring lobby...
      console.error(new Date(), 'error restoring', lobbyState.code, err);
    }

    // create a new lobby
    this.resetLobby();
  }

  // reset the lobby to initial values
  resetLobby() {
    if (typeof this.code === 'undefined') {
      this.code = Lobby.newCode();
    }

    this.members = [];
    this.players = [];
    this.spectators = [];
    this.selectedGame = '';
    this.gameConfig = {players: '#numPlayers'};
    this.admin = '';
    this.lobbyState = 'WAITING';
    this.game = null;
  }

    // get the lobby's current save state
   saveState() {
    return {
      version: 1,
      code: this.code,
      date: new Date().toString(),
      lobbyState: this.lobbyState,
      selectedGame: this.selectedGame,
      gameConfig: this.gameConfig,
      players: this.players.map(p => ({
        playerId: p.playerId,
        name: p.member ? p.member.name : p.name,
      })),
      game: this.game ? {
        config: this.game.config,
        state: this.game.save(),
      } : null,
    }
  }

  // restore a lobby from the save state
  restoreState(lobbyState) {
    if (lobbyState.code)
      this.code = lobbyState.code;
    this.members = [];

    if (lobbyState.players) {
      this.players = lobbyState.players.map(p => ({
        id: -1,
        playerId: p.playerId,
        connected: false,
        name: p.name,
      }));
    } else {
      this.players = [];
    }

    this.spectators = [];
    this.selectedGame = lobbyState.selectedGame || '';
    // use the provided game config or defaults
    this.gameConfig = lobbyState.gameConfig ||
      (this.selectedGame
        ? _.mapValues(gameInfo[this.selectedGame].config, v => v.defaults)
        : {players: '#numPlayers'});

    this.admin = '';
    this.lobbyState = lobbyState.lobbyState || 'WAITING';

    if (lobbyState.game && this.players.length > 0) {
      const { config, state } = lobbyState.game;

      const Constructor = GAMES[this.selectedGame];
      if (Constructor) {
        this.game = new Constructor(this, config, this.players.map(p => p.playerId));
        this.game.restore(state);
        const numPlayers = this.players.length;

        // cap players
        this.gameConfig.players = numPlayers;

      }
    } else {
      this.game = null;
    }
  }

  // "safely" run a function, end the current lobby game if it fails
  attempt(fn) {
    try {
      return fn();
    } catch (err) {
      console.log('Lobby Error', err);
      this.endGame();
    }
  }

  // Start the game
  startGame() {
    if(!this.selectedGame) return;

    const isPlayer = {};
    for (const p of this.players) isPlayer[p.id] = true;
    for(const p of this.members) {
      if(!isPlayer[p.id]) {
        this.spectators.push({id: p.id, name: p.name});
      }
    }

    const numPlayers = this.players.length;

    // cap players
    this.gameConfig.players = numPlayers;

    // parse config values
    const newConfig = this.configVals();
    if(!newConfig)
      return;

    const args = [this, newConfig, this.players.map(p => p.playerId)];

    const Constructor = GAMES[this.selectedGame];

    if(Constructor) {
      this.game = new Constructor(...args);
      this.lobbyState = 'PLAYING';
      this.updateMembers();
      this.sendLobbyInfo();
      this.game.start();
    }
  }

  endGame() {
    if(!this.selectedGame) return;
    if(this.lobbyState !== 'PLAYING') return;

    if(this.game) {
      this.game.stop();
      this.game.cleanup();
    }

    this.game = undefined;
    this.lobbyState = 'WAITING';

    this.updateMembers();
    this.sendLobbyInfo();
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
    if (!this.game) return;
    // find associated player
    const player = this.players.find(p => p.id === member);

    if(player) {
      this.game.handleMessage(player.playerId, type, data);
    } else {
      this.game.handleMessage(member, type, data);
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
          val = val > conf.max && conf.max ? conf.max : val;
        }
      }
      val = val == '#numPlayers' ? val : Math.floor(val);

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
          val = Math.floor(rawVal);
        if(info.min > val || info.max < val)
          return false;
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
      return;
    }
    const member = this.members.find(p => p.id === id);
    if (member) {
      member.socket.emit(...args);
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

    if((!isPlayer || isSpectator) && targetPlayer && member.name) {
      targetPlayer.id = id;
      targetPlayer.name = member.name;
      targetPlayer.member = member;
      targetPlayer.connected = true;

      // if the player was a spectator, remove them from the spectators
      if (isSpectator) {
        this.spectators.splice(this.spectators.indexOf(isSpectator), 1);
      }

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
    if(!player.name) {
      return;
    }

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
          continue;
        }

        // Move the admin to the in case this player gets culled
        if(p.id === this.admin) {
          this.players.splice(0, 0, ...this.players.splice(i, 1));
        }
      }

      // Remove players who are over the max player cap
      while(this.gameConfig.players > 0 && this.players.length > this.gameConfig.players) {
        const {id} = this.players.pop();

        // Remove the admin if one of the removed players is the admin somehow
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

  // lobby info is the current lobby state sent to the players
  genLobbyInfo() {
    const isPlayer = {};
    for (const p of this.players) isPlayer[p.id] = true;

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

// dev lobby
Lobby.create('devaaaa').persist = true;


module.exports = Lobby;
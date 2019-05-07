const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const path = require('path');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const PORT = process.env.PORT || 8080;

const VERSION = require('./package.json').version;

app.use(express.static('./public'));
app.use(bodyParser.urlencoded({ extended: false }));

const Member = require('./core/Member');
const Lobby = require('./core/Lobby');

const EMOTES = [
  'smile',
  'frown',
  'hand peace',
  'heart',
  'question',
  'exclamation',
  'wait',
  'write',
  'check',
  'times',
  'thumbs up',
  'thumbs down',
];

io.on('connection', socket => {
  const player = new Member(socket);
  socket.emit('member:id', player.id);
  socket.emit('version', VERSION);

  socket.on('member:name', name => {

    if(!player.lobby) {
      socket.emit('lobby:leave');
      return;
    }

    // remove zero width no break spaces, trim spaces
    name = name.replace(/[\u200B-\u200D\uFEFF\n\t]/g, '').trim()

    if(name.length > 0 && name.length < 16) {
      player.name = name;
      socket.emit('member:nameOk', true);
      if(player.lobby) {
        player.lobby.updateMembers();
        player.lobby.sendLobbyInfo();
      }
    } else {
      socket.emit('member:nameOk', false);
    }
  });

  // Create a lobby if the player is not in one
  socket.on('lobby:create', () => {
    if(!player.lobby) {
      const lobby = new Lobby();
      const code = lobby.code;
      player.lobby = lobby;
      Lobby.lobbies[code] = lobby;
      socket.emit('lobby:join', code);
      Lobby.lobbies[code].addMember(player);
    }
  });

  // Allow players to request current lobby info
  socket.on('lobby:info', () => {
    if(player.lobby) {
      player.socket.emit('lobby:info', player.lobby.genLobbyInfo());
    }
  });

  // Allow players to request current lobby info
  socket.on('game:info', () => {
    const lobby = player.lobby;
    if(lobby && lobby.game) {
      const game = lobby.game;
      player.socket.emit('game:info', game.getState());
      lobby.getPlayerState(player.id);
    }
  });

  // Let a player join a lobby with a code
  socket.on('lobby:join', code => {
    code = code.toLowerCase();
    if(!player.lobby && Lobby.lobbyExists(code)) {
      player.lobby = Lobby.lobbies[code];
      socket.emit('lobby:join', code);
      Lobby.lobbies[code].addMember(player);
    }
  });

  socket.on('lobby:replace', pid => {
    if(player.lobby) {
      player.lobby.replacePlayer(player, pid);
    } else {
      socket.emit('lobby:leave');
    }
  });

  socket.on('lobby:emote', emote => {
    if(player.lobby) {
      const now = Date.now();
      if(now - player.lastEmote < 1000 || !EMOTES.includes(emote))
        return;

      player.lastEmote = now;
      player.lobby.emitAll('lobby:emote', player.id, emote);
    } else {
      socket.emit('lobby:leave');
    }
  });

  // Allow an admin player to change what game is being played
  socket.on('lobby:game:set', game => {
    if(player.isAdmin()) {
      player.lobby.setGame(game);
    }
  });

  // Allow an admin player to change what game is being played
  socket.on('game:start', game => {
    if(player.isAdmin()) {
      player.lobby.startGame();
    }
  });

  socket.on('game:end', game => {
    if(player.isAdmin()) {
      player.lobby.endGame();
    }
  });

  // Toggle whether this member is a spectator
  socket.on('lobby:spectate', () => {
    if(player.lobby) {
      player.lobby.toggleSpectate(player);
    } else {
      socket.emit('lobby:leave');
    }
  });

  // Let admins make players spectators
  socket.on('lobby:admin:toggle', targetId => {
    if(player.isAdmin && targetId !== player.id) {
      const targetPlayer = player.lobby.players.find(p => p.id === targetId);
      if(targetPlayer && targetPlayer.member)
        player.lobby.toggleSpectate(targetPlayer.member);
    }
  });

  // Change the admin
  socket.on('lobby:admin:grant', targetId => {
    if(player.isAdmin && targetId !== player.id) {
      const targetPlayer = player.lobby.players.find(p => p.id === targetId);
      if(targetPlayer && targetPlayer.member) {
        player.lobby.admin = targetPlayer.id;
        player.lobby.sendLobbyInfo();
      }
    }
  });

  // Core gameplay messages
  socket.on('game:message', (type, data) => {
    if(player.lobby) {
      player.lobby.gameMessage(player.id, type, data);
    } else {
      socket.emit('lobby:leave');
    }
  });

  // Change game config if the player is an admin
  socket.on('lobby:game:config', (name, val) => {
    if(player.isAdmin()) {
      player.lobby.setConfig(name, val);
    }
  });

  // Leave the lobby if a player is in one
  socket.on('lobby:leave', () => {
    player.name = '';
    Lobby.removePlayer(player);
  });

  // Remove the player from a lobby on disconnection
  socket.on('disconnect', data => {
    Lobby.removePlayer(player);
  });
});

// Determine if a lobby exists
app.get('/api/v1/lobby/:code', (req, res) => {
  const code = req.params.code.toLowerCase();
  if(Lobby.lobbyExists(code)) {
    res.status(200).json({
      message: 'Lobby Exists',
    });
  } else {
    res.status(404).json({
      message: 'Lobby Does Not Exist',
    });
  }
});

app.get('/api/v1/info', (req, res) => {
  res.status(200).json({
    lobbies: _.size(Lobby.lobbies),
    games: _.chain(Lobby.lobbies)
      .values()
      .filter(l => l.game)
      .size()
      .value(),
    players: io.engine.clientsCount,
  });
});

// Every request goes through the index, Vue will handle 404s
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the webserver
server.listen(PORT, () => console.log(`Started server on :${PORT}!`));

const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const path = require('path');

const app = express();
var server = require('http').Server(app);
const io = require('socket.io')(server);
const PORT = process.env.PORT || 8080;

app.use(express.static('./public'));
app.use(bodyParser.urlencoded({ extended: false }));

const Member = require('./core/Member');
const Lobby = require('./core/Lobby');

const lobbies = {};

/**
 * Removes player from his/her lobby
 * @param  {Member} player Player potentially in a lobby
 */
function removePlayerFromLobby(player) {
  const lobby = player.lobby;

  if(!lobby)
    return;

  lobby.removeMember(player);
  player.lobby = undefined;

  if(lobby.empty()) {
    lobbies[lobby.code] = false;
  }
}

io.on('connection', socket => {
  const player = new Member(socket);

  // Create a lobby if the player is not in one
  socket.on('lobby:create', () => {
    if(!player.lobby) {
      const lobby = new Lobby();
      player.lobby = lobby;
      lobbies[lobby.code] = lobby;
      socket.emit('lobby:join', lobby.code);
    }
  });

  // Let a player join a lobby with a code
  socket.on('lobby:join', code => {
    code = code.toLowerCase();
    if(!player.lobby && lobbies.hasOwnProperty(code)) {
      lobbies[code].addMember(player);
      socket.emit('lobby:join', code);
    }
  });

  // Leave the lobby if a player is in one
  socket.on('lobby:leave', () => {
    removePlayerFromLobby(player);
  });

  // Remove the player from a lobby on disconnection
  socket.on('disconnect', data => {
    removePlayerFromLobby(player);
  });
});

// Determine if a lobby exists
app.get('/api/v1/lobby/:code', (req, res) => {
  const code = req.params.code.toLowerCase();
  if(lobbies.hasOwnProperty(code)) {
    res.status(200).json({
      message: 'Lobby Exists',
    });
  } else {
    res.status(404).json({
      message: 'Lobby Does Not Exist',
    });
  }
});

// Every request goes through the index, Vue will handle 404s
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the webserver
server.listen(PORT, () => console.log(`Started server on :${PORT}!`));

const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const path = require('path');

const app = express();
var server = require('http').Server(app);
const io = require('socket.io')(server);
const PORT = process.env.PORT || 8080;

const lobbies = {};

app.use(express.static('./public'));
app.use(bodyParser.urlencoded({ extended: false }))

io.on('connection', socket => {
  socket.on('disconnect', data => {
  });
});

app.get('/api/v1/lobby/:id', (req, res) => {
  const id = req.params.id.toLowerCase();
  if(lobbies[id]) {
    res.status(200).json({
      message: 'Lobby Exists',
    });
  } else {
    res.status(404).json({
      message: 'Lobby Does Not Exist',
    });
  }
})

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


server.listen(PORT, () => console.log(`Started server on :${PORT}!`));

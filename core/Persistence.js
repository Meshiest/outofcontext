const _ = require('lodash');
const pako = require('pako');
const fs = require('fs');
const glob = require('glob');

// ~1 month expire time
const EXPIRE_TIME = 1000 * 60 * 60 * 24 * 30;

const saveName = code => `persistence/${code}.json.zip`;

// determine if there is a file named after a lobby code
function saveExists(code) {
  return fs.existsSync(saveName(code));
}

// remove an expired lobby
function cullSave(filename) {
  try {
    const stat = fs.statSync(filename);
    if (Date.now() - EXPIRE_TIME > stat.ctime) {
      fs.unlinkSync(filename);
      return true;
    }      
  } catch (e) {}

  return false;
}

// attempt to cull the saves
function cullSaves() {
  const files = glob.sync(saveName('*'), {});
  for (const f of files) {
    cullSave(f);
  }
}

// save a lobby state to compressed file
function saveLobbyState(lobby) {
  const state = lobby.saveState();
  const data = pako.deflate(JSON.stringify(state));
  const fd = fs.openSync(saveName(lobby.code), 'w');
  fs.writeSync(fd, data);
}

// decompress a lobby save file
function restoreLobbyState(code) {
  const data = fs.readFileSync(saveName(code));
  const state = JSON.parse(pako.inflate(data, {to: 'string'}));
  return state;
}

module.exports = {
  saveExists,
  saveLobbyState,
  restoreLobbyState,
  cullSaves,
};
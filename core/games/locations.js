const Game = require('./game');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');


module.exports = class Locations extends Game {
  constructor(lobby, config, players) {
    super(lobby, config, players);
    this.underground = '';
    this.first = '';
    this.location = '';
    this.duration = this.config.duration;
    this.startTime = 0;
    this.reveal = false;
    this.guessing = false;
  }

  doReveal() {
    this.reveal = true;
    this.sendGameInfo();
  }

  timeUp() {
    this.duration = 1;
    this.guessing = true;
    this.startTime = Date.now();
    clearTimeout(this.timer);
    this.timer = setTimeout(this.doReveal.bind(this), 60 * 1000);
    this.sendGameInfo();
  }

  start() {
    this.guessing = false;
    this.reveal = false;
    this.underground = _.sample(this.players);
    this.first = _.sample(this.players);
    this.location = _.sample(this.config.locationSet);
    this.startTime = Date.now();
    clearTimeout(this.timer);
    this.timer = setTimeout(this.timeUp.bind(this), this.duration * 60 * 1000);

    this.sendGameInfo();
  }

  stop() {}

  cleanup() {
    clearTimeout(this.timer);
  }

  handleMessage(pid, type, data) {}

  getPlayerState(pid) {
    return {
      id: pid,
      state: this.underground === pid ? 'UNDERGROUND' : 'LOCATION',
      location: this.underground === pid ? '' : this.location,
    };
  }

  getState() {
    return {
      // players who are writing have pencil icons, players who are not have a clock icon
      start: this.startTime,
      reveal: this.reveal,
      guessing: this.guessing,
      underground: this.guessing ? this.underground : '',
      location: this.reveal ? this.location : '',
      duration: this.duration,
      first: this.first,
      locations: this.config.locationSet,
      icons: this.players.reduce((obj, p) => ({
        ...obj,
        [p]: this.first === p ? 'hand point right' : '',
      }), {}),
    };
  }
};

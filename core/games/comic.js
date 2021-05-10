const _ = require('lodash');
const Story = require('./story');
const Sanitize = require('./util/Sanitize');

module.exports = class Comic extends Story {
  constructor(lobby, config, players) {
    super(lobby, config, players);
    this.config.contextLen = 1;

    this.config.numStories = config.numPieces;

    this.enableCaptions = config.gamemode.captions;
    this.showCaptions = this.enableCaptions && config.gamemode.show_captions;
    this.showDrawings = config.gamemode.show_drawings;

    // Make sure the same player does not edit the chain until other players had a chance
    this.clearance = config.players - 1;
  }

  handleMessage(pid, type, data) {
    const chain = this.chains.find(s => s.editor === pid);
    let drawing, caption;

    // sanitize data
    if (type === 'comic:line') {
      if (typeof data !== 'object') return;
      const keys = Object.keys(data);
      if (keys.length > 2 || keys.length < 1) return;

      if (!this.enableCaptions && data.caption) return;

      // validate drawings
      drawing = data.drawing;
      if(!_.isArray(drawing) || !_.isArray(drawing[0]))
        return;

      if(!drawing.every(l => l[0] === 'Path'))
        return;

      // ensure captions are sanitized and strings
      if (this.enableCaptions) {
        if (typeof data.caption !== 'string') return;
        const line = Sanitize.str(data.caption);
        if(line.length < 1 || line.length > 256)
          return;
        caption = line;
      }
    }

    switch(type) {

    case 'comic:result':
      if (this.getGameProgress() === 1) {
        this.emitTo(pid, 'comic:result', this.compileStories());
      }
      break;

    // Handle writing the next line
    case 'comic:line':
      const story = this.chains.find(s => s.editor === pid);
      if(!story) return;

      this.lastEdit[pid] = Date.now();
      story.addLink(pid, { drawing, caption });

      this.redistribute();

      break;

    case 'comic:done':
      this.finishedReading[pid] = data === true;
      this.sendGameInfo();

      if(this.players.every(p => this.finishedReading[p]))
        this.lobby.endGame();

      break;

    case 'chain:like':
      const progress = this.getGameProgress();
      if(typeof data === 'number' && data >= 0 && data <= this.chains.length && progress === 1) {
        this.chains[data].likes[pid] = !this.chains[data].likes[pid];
        this.sendGameInfo();
      }
      break;
    }
  }

  getPlayerState(pid) {
    const story = this.chains.find(s => s.editor === pid);

    if (story) {
      // still supporting context len despite it not being in the config at the moment
      const myLink = story.chain.slice(-this.config.contextLen);
      return {
        id: pid,
        state: 'EDITING',
        isLastLink: story.chain.length === this.config.numLinks - 1,
        link: myLink.map(l => ({
          drawing: this.showDrawings ? l.drawing : [],
          caption: this.showCaptions ? l.caption : '',
        })),
      };
    }

    return {
      id: pid,
      liked: this.chains.map(s => s.likes[pid]),
      state: this.getGameProgress() === 1 ? 'READING' : 'WAITING',
    };
  }

  getState() {
    const hasStory = {};
    for (const c of this.chains.filter(s => s.editor))
      hasStory[c.editor] = true;

    const progress = this.getGameProgress();
    return {
      // players who are writing have pencil icons, players who are not have a clock icon
      icons: Object.fromEntries(this.players.map(p => ([
        p,
        progress === 1
          ? this.finishedReading[p] ? 'check' : 'clock'
          : hasStory[p] ? 'paint brush' : 'clock',
      ]))),
      progress,
      colors: this.config.colors,
      continuous: this.config.gamemode.continuous,
      enableCaptions: this.enableCaptions,
      showCaptions: this.showCaptions,
      showDrawings: this.showDrawings,
      likes: this.chains.map(s => _.size(_.filter(s.likes, l => l))),
      isComplete: progress === 1,
    };
  }
};

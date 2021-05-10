const _ = require('lodash');
const Story = require('./story');
const Sanitize = require('./util/Sanitize');

module.exports = class Draw extends Story {
  constructor(lobby, config, players) {
    super(lobby, config, players);
    this.config.contextLen = 1;

    this.config.numStories = config.players;
    // Make the number of links odd
    this.config.numLinks -= (this.config.numLinks - 1) % 2;

    // Make sure the same player does not edit the chain until other players had a chance
    this.clearance = config.players - 1;
  }

  handleMessage(pid, type, data) {
    const chain = this.chains.find(s => s.editor === pid);
    const expectedType = chain && chain.chain.length % 2 == 0 ? 'desc' : 'image';

    switch(type) {

    case 'draw:result':
      if (this.getGameProgress() === 1) {
        this.emitTo(pid, 'draw:result', this.compileStories());
      }
      break;

    // Handle passing of images
    case 'draw:image':
      if(!chain || expectedType !== 'image')
        return;

      if(!_.isArray(data) || !_.isArray(data[0]))
        return;

      if(!data.every(l => l[0] === 'Path'))
        return;

      chain.addLink(pid, {type: 'image', data});

      this.lastEdit[pid] = Date.now();
      this.redistribute();
      break;

    // Handle passing of descriptions
    case 'draw:desc':
      if(!chain || expectedType !== 'desc')
        return;

      if(typeof data !== 'string')
        return;

      const line = Sanitize.str(data);

      if(line.length < 1 || line.length > 256)
        return;

      this.lastEdit[pid] = Date.now();
      chain.addLink(pid, {type: 'desc', data: line});

      this.redistribute();

      break;

    case 'draw:done':
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

  getState() {
    const hasChain = {};
    for (const c of this.chains.filter(s => s.editor))
      hasChain[c.editor] = c.chain.length % 2 == 0 ? 'pencil' : 'paint brush';

    const progress = this.getGameProgress();
    return {
      // players who are writing have pencil icons, players who are not have a clock icon
      icons: Object.fromEntries(this.players.map(p => ([
        p,
        progress === 1
          ? this.finishedReading[p] ? 'check' : 'clock'
          : hasChain[p] || 'clock',
      ]))),
      progress,
      timeLimit: this.config.timeLimit,
      colors: this.config.colors,
      likes: this.chains.map(s => _.size(_.filter(s.likes, l => l))),
      isComplete: progress === 1,
    };
  }
};

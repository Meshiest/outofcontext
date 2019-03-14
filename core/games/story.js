const Game = require('./game');
const _ = require('lodash');
const Chain = require('./util/Chain');

module.exports = class Story extends Game {
  constructor(lobby, config, players) {
    super(lobby, config, players);
    this.chains = [];

    this.clearance = 2;

    this.lastEdit = {};
    for(const p of players)
      this.lastEdit[p] = 0;

    this.finishedReading = {};
  }


  // Find a story for a player
  findChainForPlayer(player) {
    // Find a chain for a player
    const { numLinks } = this.config;

    // Order chains by length
    let available = _.sortBy(
      this.chains
        .filter(s => !s.editor) // Only find chains that aren't being worked on
        .filter(s => s.chain.length < numLinks) // chain is at capacity
        .filter(s => s.lastEditor != player) // Find chains the player didn't just edit
        .filter(s => (s.collaborators[player] || 0) <= s.avgEdits()),
      s => s.chain.length
    );

    // If there is enough players, try to ensure the chain isn't alternating
    if(this.players.length !== this.clearance)
      available = available.filter(s => !s.editors.slice(-this.clearance).includes(player));

    return available[0];
  }

  start() {
    const numPlayers = this.players.length;
    const { numStories, numLinks } = this.config;

    this.chains = _.range(numStories)
      .map(() => new Chain(numPlayers, numLinks));

    // Every player has an equal chance of getting a story
    const players = _.shuffle(this.players);

    for(const player of players) {
      const story = this.findChainForPlayer(player);
      if(!story) {
        break;
      }
      story.editor = player;
    }

    this.sendGameInfo();
  }

  // Find stories for those who are not working on one
  redistribute() {
    const hasStory = this.chains.filter(s => s.editor).reduce((obj, i) => ({...obj, [i.editor]: true}), {});

    // find players not editing stories
    const players = _.sortBy(this.players.filter(p => !hasStory[p]), p => this.lastEdit[p]);

    for(const player of players) {
      const story = this.findChainForPlayer(player);
      if(!story)
        continue;
      story.editor = player;
    }

    this.sendGameInfo();
  }

  stop() {}

  cleanup() {}

  handleMessage(pid, type, data) {
    switch(type) {

    // Handle writing the next line
    case 'story:line':
      const story = this.chains.find(s => s.editor === pid);
      if(!story)
        return;

      const line = data.replace(/[\u200B-\u200D\uFEFF\n\t]/g, '').trim();

      if(line.length < 1 || line.length > 255)
        return;

      this.lastEdit[pid] = Date.now();
      story.addLink(pid, line);

      this.redistribute();

      break;

    case 'story:done':
      this.finishedReading[pid] = data === true;
      this.sendGameInfo();
      break;
    }
  }

  getGameProgress() {
    const { numStories, numLinks } = this.config;
    const totalLines = numStories * numLinks;
    const writtenLines = _.sumBy(this.chains, s => s.chain.length);
    return writtenLines / totalLines;
  }

  getPlayerState(pid) {
    const story = this.chains.find(s => s.editor === pid);
    const done = this.getGameProgress() === 1;

    return story ? {
      id: pid,
      state: 'EDITING',
      isLastLink: story.chain.length === this.config.numLinks - 1,
      link: story.chain.slice(-1)[0],
    } : {
      id: pid,
      state: done ? 'READING' : 'WAITING',
    };
  }

  compileStories() {
    return this.chains.map(s =>
      _.zip(s.chain, s.editors)
      .map(([link, e]) => ({
        link,
        editor: this.config.anonymous ? '' : e,
      }))
    );
  }

  getState() {
    const hasStory = this.chains.filter(s => s.editor).reduce((obj, i) => ({...obj, [i.editor]: true}), {});
    const progress = this.getGameProgress();
    return {
      // players who are writing have pencil icons, players who are not have a clock icon
      icons: this.players.reduce((obj, p) => ({
        ...obj,
        [p]: progress === 1 ?
          (this.finishedReading[p] ?
            'check' :
            'clock') :
          (hasStory[p] ?
            'pencil' :
            'clock')
      }), {}),
      progress,
      stories: progress === 1 ? this.compileStories() : [],
    };
  }
};

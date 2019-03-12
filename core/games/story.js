const Game = require('./game');
const _ = require('lodash');

class StoryChain {
  constructor(numPlayers, length) {
    this.numPlayers = numPlayers;

    // Track how many time players contribute
    this.collaborators = {};

    // Id of the last author
    this.lastEditor = '';

    // Id of the current author
    this.editor = '';

    // List of lines in the story
    this.story = [];

    // List of editors
    this.editors = [];
  }

  avgEdits() {
    return _.sum(_.values(this.collaborators)) / this.numPlayers;
  }

  addLine(pid, line) {
    this.lastEditor = this.editor;
    this.collaborators[pid] = (this.collaborators[pid] || 0) + 1;
    this.story.push(line);
    this.editors.push(pid);
    this.editor = '';
  }
}

module.exports = class Story extends Game {
  constructor(lobby, config, players) {
    super(lobby, config, players);
    this.stories = [];

    this.lastWrite = {};
    for(const p of players)
      this.lastWrite[p] = 0;
  }


  // Find a story for a player
  findStoryForPlayer(player) {
    const { numLines } = this.config;

    // Order stories by length
    let available = _.sortBy(
      this.stories
        .filter(s => !s.editor) // Only find stories that aren't being worked on
        .filter(s => s.story.length < numLines) // Story is at capacity
        .filter(s => s.lastEditor != player) // Find stories the player didn't just edit
        .filter(s => (s.collaborators[player] || 0) <= s.avgEdits()),
      s => s.story.length
    );

    // If there is enough players, try to ensure the story isn't alternating
    if(this.players.length !== 2)
      available = available.filter(s => !s.editors.slice(-2).includes(player));

    return available[0];
  }

  start() {
    const numPlayers = this.players.length;
    const { numStories, numLines } = this.config;

    this.stories = Array(numStories)
      .fill().map(() => new StoryChain(numPlayers, numLines));

    // Every player has an equal chance of getting a story
    const players = _.shuffle(this.players);

    for(const player of players) {
      const story = this.findStoryForPlayer(player);
      if(!story) {
        break;
      }
      story.editor = player;
    }

    this.sendGameInfo();
  }

  // Find stories for those who are not working on one
  redistribute() {
    const hasStory = this.stories.filter(s => s.editor).reduce((obj, i) => ({...obj, [i.editor]: true}), {});

    // find players not editing stories
    const players = _.sortBy(this.players.filter(p => !hasStory[p]), p => this.lastWrite[p]);

    for(const player of players) {
      const story = this.findStoryForPlayer(player);
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
      const story = this.stories.find(s => s.editor === pid);
      if(!story)
        return;

      const line = data.replace(/[\u200B-\u200D\uFEFF\n\t]/g, '').trim();

      if(line.length < 1 || line.length > 255)
        return;

      this.lastWrite[pid] = Date.now();
      story.addLine(pid, line);

      this.redistribute();

      break;
    }
  }

  getGameProgress() {
    const { numStories, numLines } = this.config;
    const totalLines = numStories * numLines;
    const writtenLines = _.sumBy(this.stories, s => s.story.length);
    return writtenLines / totalLines;
  }

  getPlayerState(pid) {
    const story = this.stories.find(s => s.editor === pid);
    const done = this.getGameProgress() === 1;

    return story ? {
      state: 'EDITING',
      isLastLine: story.story.length === this.config.numLines - 1,
      line: story.story.slice(-1)[0],
    } : {
      state: done ? 'READING' : 'WAITING',
    };
  }

  compileStories() {
    return this.stories.map(s =>
      _.zip(s.story, s.editors)
      .map(([line, e]) => ({
        line,
        editor: this.config.anonymous ? '' : e,
      }))
    );
  }

  getState() {
    const hasStory = this.stories.filter(s => s.editor).reduce((obj, i) => ({...obj, [i.editor]: true}), {});
    const progress = this.getGameProgress();
    return {
      // players who are writing have pencil icons, players who are not have a clock icon
      icons: this.players.reduce((obj, p) => ({
        ...obj,
        [p]: progress === 1 ?
          'check' :
          hasStory[p] ?
            'pencil' :
            'clock'
      }), {}),
      progress,
      stories: progress === 1 ? this.compileStories() : [],
    };
  }
};

const _ = require('lodash');
const Story = require('./story');

const Sanitize = require('./util/Sanitize');
const Chain = require('./util/Chain');

const HOTWORDRAND = /ITEM#?R/g;
const HOTWORDNUM = /ITEM#?\d{1,3}/g;
const HOTWORD = /ITEM/g;

function parseItem(str, i, items) {
  return str
    .replace(HOTWORDRAND, str => _.sample(items)) // Random replacement
    .replace(HOTWORDNUM, str => { // Specific replacement
      const parsed = parseInt(str.match(/\d+/)) - 1;
      const val = _.clamp(parsed, 0, items.length - 1);
      return items[val];
    })
    .replace(HOTWORD, items[i]); // Default replacement

}

module.exports = class Recipe extends Story {
  constructor(lobby, config, players) {
    super(lobby, config, players);
    this.likes = [];
  }


  // Find a story for a player
  findChainForPlayer(player) {
    // Find a chain for a player
    const { numSteps } = this.config;

    const fullChains = this.chains
      .filter(c => c.type !== 'comment')
      .every(c => c.chain.length == numSteps);

    if(fullChains)
      return;

    // Split up comments from ingredients / steps
    let [ comments, chains ] = _.chain(this.chains)
      .filter(c => !c.editor) // no edited recipes
      .filter(c => c.lastEditor != player) // no edited recipes
      .filter(c => (c.collaborators[player] || 0) <= c.avgEdits()) // no over-contributed recipes
      .sortBy(c => c.chain.length) // shortest recipes first
      .partition(c => c.type === 'comment') // separate comments from steps and instructions
      .value()

    const available = _.chain(chains)
      .filter(c => c.chain.length < numSteps)
      .sortBy(c => !(c.type === 'step' && !c.theme))
      .value();

    // First available ingredient or step or the first available comment
    return available[0] || comments[0];
  }

  start() {
    const numPlayers = this.players.length;
    const { numRecipes, numSteps } = this.config;

    // Create chains for each recipe
    this.chains = _.range(numRecipes * 3)
      .map(() => new Chain(numPlayers, numSteps));

    this.likes = _.range(numRecipes).map(() => ({}));

    // Assign a type to each chain (there are 3 kinds of chains you can edit)
    this.chains.forEach((chain, i) =>
      chain.type = ['step', 'ingredient', 'comment'][i % 3]);

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

  handleMessage(pid, type, data) {
    const chain = this.chains.find(c => c.editor === pid);
    const noEditors = !this.chains.some(c => c.editor);
    let line;

    switch(type) {

    case 'recipe:result':
      if (this.compiled) {
        this.emitTo(pid, 'recipe:result', this.compiled);
      }
      break;

    // Handle writing the next line
    case 'recipe:theme':
      if(!chain)
        return;

      // must be actually editing a theme
      if(chain.type !== 'step' || chain.theme)
        return;

      if(typeof data !== 'string')
        return;

      line = Sanitize.str(data);

      if(line.length < 1 || line.length > 256)
        return;

      this.lastEdit[pid] = Date.now();
      chain.lastEditor = pid;
      chain.themeEditor = pid;
      chain.theme = line;
      chain.editor = '';
      chain.collaborators[pid] = (chain.collaborators[pid] || 0) + 1;

      this.redistribute();

      break;

    case 'recipe:line':
      if(!chain)
        return;

      if(chain.type === 'step' && !chain.theme)
        return;

      if(typeof data !== 'string')
        return;

      line = Sanitize.str(data);

      if(chain.type === 'step' && !line.match(HOTWORD))
        return;

      if(line.length < 1 || line.length > 256)
        return;

      this.lastEdit[pid] = Date.now();
      chain.addLink(pid, line);

      this.redistribute();

      break;

    case 'recipe:done':
      this.finishedReading[pid] = data === true;
      this.sendGameInfo();

      if(this.players.every(p => this.finishedReading[p]))
        this.lobby.endGame();

      break;

    case 'chain:like':
      const done = this.getGameProgress() === 1 && noEditors;
      if(typeof data === 'number' && data >= 0 && data <= this.chains.length && done) {
        this.likes[data][pid] = !this.likes[data][pid];
        this.sendGameInfo();
      }
      break;
    }
  }

  restore(blob) {
    if (blob.version !== 1 && blob.version !== 2)
      return;

    this.chains = blob.chains.map(Chain.restore);
    this.finishedReading = blob.finishedReading;
    this.compiled = blob.compiled;
  }

  save() {
    return {
      version: 2,
      chains: this.chains.map(s => s.save()),
      finishedReading: this.finishedReading,
      compiled: this.compiled,
    }
  }

  getGameProgress() {
    const { numRecipes, numSteps } = this.config;
    const totalLines = numRecipes * numSteps * 2;
    const writtenLines = _.chain(this.chains)
      .filter(c => c.type !== 'comment')
      .sumBy(c => c.chain.length);
    return writtenLines / totalLines;
  }

  getPlayerState(pid) {
    const { numSteps } = this.config;
    const chain = this.chains.find(s => s.editor === pid);
    const noEditors = !this.chains.some(s => s.editor);
    const done = this.getGameProgress() === 1 && noEditors;

    return chain ? {
      id: pid,
      state: 'EDITING',
      link:
        chain.type === 'step' ?
          (!chain.theme ? {
            type: 'theme'
          } : {
            type: 'step',
            theme: chain.theme,
            index: chain.chain.length + 1,
            total: numSteps,
          }) :
        chain.type === 'ingredient' ? {
          type: 'ingredient',
          ingredients: chain.chain
        } :
        chain.type === 'comment' ? {
          type: 'comment',
          comments: chain.chain,
        } :
        { type: null },
    } : {
      id: pid,
      liked: this.likes.map(s => s[pid]),
      state: done ? 'READING' : 'WAITING',
    };
  }

  compileRecipes() {
    const { comment, step, ingredient } = _.chain(this.chains)
      .shuffle()
      .groupBy('type')
      .value();

    // Shuffle ingredients with its editors
    ingredient.forEach(i => {
      const [ editors, chain ] = _.chain(i.editors)
        .zip(i.chain)
        .shuffle()
        .unzip()
        .value();

      i.editors = editors;
      i.chain = chain;
    });

    return step.map((s, i) => ({
      theme: s.theme,
      author: this.config.anonymous ? '' : s.themeEditor,
      steps: _.zip(s.chain, ingredient[i].chain, s.editors, ingredient[i].editors)
        .map(([instr, item, editor, helper], j) => ({
          link: parseItem(instr, j, ingredient[i].chain),
          editors: this.config.anonymous ? ['', ''] : [editor, helper],
        })),
      comments: _.zip(comment[i].chain, comment[i].editors)
        .map(([link, e]) => ({
          link: parseItem(link, _.random(ingredient[i].chain.length-1), ingredient[i].chain),
          editor: this.config.anonymous ? '' : e,
        }))
    }))
  }

  getState() {
    const hasRecipe = this.chains.filter(s => s.editor).reduce((obj, i) => ({...obj, [i.editor]: i}), {});
    const progress = this.getGameProgress();
    const noEditors = !this.chains.some(s => s.editor);
    this.compiled = this.compiled || progress === 1 && noEditors && this.compileRecipes();

    return {
      // players who are writing have pencil icons, players who are not have a clock icon
      icons: this.players.reduce((obj, p) => ({
        ...obj,
        [p]: progress === 1 && noEditors ?
          (this.finishedReading[p] ?
            'check' :
            'clock') :
          {
            wait: 'clock',
            step: hasRecipe[p] && !hasRecipe[p].theme ? 'lightbulb' : 'pencil',
            ingredient: 'shopping basket',
            comment: 'comment',
          }[hasRecipe[p] ? hasRecipe[p].type : 'wait']
      }), {}),
      progress,
      likes: this.likes.map(s => _.filter(s, l => l).length),
      isComplete: progress === 1 && noEditors,
    };
  }
};

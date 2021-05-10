const Game = require('./game');
const _ = require('lodash');
const Story = require('./story');

const Sanitize = require('./util/Sanitize');
const Random = require('./util/Random');

// const WORD_REGEX = /(?<=\s|^|\b)(?:[-'%$#&\/]\b|\b[-'%$#&\/]|\d*\.?\d+|[A-Za-z0-9]|\([A-Za-z0-9]+\))+(?=\s|$|\b)/g;
const WORD_REGEX = /(?:\b|^)\S+\b/g;
const COST = {
  truncate: 2,
  censor: 5,
}

String.prototype.matchAll = function(pattern) {
  const clone = new RegExp(pattern.source, pattern.flags);
  const matches = [];
  let match;
  while(match = clone.exec(this))
    matches.push(match);

  return matches;
};

function getWords(str) {
  return str.matchAll(WORD_REGEX);
}

module.exports = class Redacted extends Story {
  constructor(lobby, config, players) {
    super(lobby, config, players);
    this.config.contextLen = 1;

    // Make the number of links a multiple of 3
    //
    this.icons = {
      line: 'pencil',
      tamper: 'eraser',
      repair: 'redo',
    };

    const { gamemode: { censor, truncate } } = config;

    // Autonomous mode means no human editing
    this.autonomous = (censor === 'random' || censor === 'none') && (truncate === 'random' || truncate === 'none');

    this.phases = ['line', 'tamper', 'repair'];

    this.config.numLinks = config.numLinks * 3;

    /*
      Config =
        anonymous: bool
     */

    // Make sure the same player does not edit a chain he or she may already have seen
    this.clearance = 3;
  }

  handleMessage(pid, type, data) {
    const chain = this.chains.find(s => s.editor === pid);
    const expectedType = chain && this.phases[chain.chain.length % 3];
    const lastChain = chain && _.last(chain.chain);

    let line;

    // number of words in the previous line
    const wordCount = lastChain && expectedType === 'tamper'
      ? getWords(lastChain.data).length
      : 0;
    const { ink, gamemode } = this.config;

    switch(type) {

    case 'redacted:result':
      if (this.getGameProgress() === 1) {
        this.emitTo(pid, 'redacted:result', this.compileStories());
      }
      break;

    // Handle passing of repairs
    case 'redacted:repair':
      if(!chain || expectedType !== 'repair')
        return;

      if(lastChain.kind === 'truncate') {
        if(typeof data !== 'string')
          return;

        line = Sanitize.str(data);

        if(line.length < 1 || line.length > 256 || getWords(line).length === 0)
          return;

        chain.addLink(pid, {type: 'repair', kind: 'truncate', data: line});

      } else if(lastChain.kind === 'censor') {
        if(!_.isArray(data) || data.some(d =>
              !_.isArray(d) ||
              d.length !== 2 ||
              typeof d[0] !== 'number' ||
              typeof d[1] !== 'string'))
          return;

        // The chain must be the same length
        if(lastChain.data.indexes.length !== data.length)
          return;

        data = _.uniqBy(data, d => d[0])
          .map(([i, s]) => [i, Sanitize.str(s)]);

        // every index must be in the previous chain's index
        // and every "word" must be sufficiently short
        if(!data.every(([i, s]) =>
            lastChain.data.indexes.includes(i) &&
            s.length >= 1 && s.length <= 32 &&
            getWords(s).length === 1
          ))
          return;

        chain.addLink(pid, {type: 'repair', kind: 'censor', data});
      } else {
        return;
      }

      this.lastEdit[pid] = Date.now();
      this.redistribute();

      break;

    // Handle passing of truncate style tampers (words off end)
    case 'redacted:truncate':
      if(!chain || expectedType !== 'tamper' || gamemode.truncate !== 'player')
        return;

      // limit truncating over half of line
      if(typeof data !== 'number' || data < 1 || data > Math.ceil(wordCount / 2))
        return;

      // limit using too much ink
      if(data * COST.truncate > ink)
        return;

      const prevLine = getWords(lastChain.data);
      const end = prevLine[prevLine.length - data];

      chain.addLink(pid, {
        type: 'tamper',
        kind: 'truncate',
        data: {
          line: lastChain.data.slice(0, end.index),
          length: lastChain.data.length - end.index,
          count: data,
        }
      });

      this.lastEdit[pid] = Date.now();
      this.redistribute();

      break;

    // Handle passing of censor style tampers (words in middle)
    case 'redacted:censor':
      if(!chain || expectedType !== 'tamper' || gamemode.censor !== 'player')
        return;

      if(!_.isArray(data))
        return;

      data = _.uniq(data);

      if(data.length < 1)
        return;

      // data is an array of integers bounded by the word count
      if(data.some(d => typeof d !== 'number' || d < 0 || d >= wordCount || Math.floor(d) !== d))
        return

      // can't use too much ink or go over half the words
      if(data.length * COST.censor > ink || data.length > Math.ceil(wordCount / 2))
        return;

      const words = getWords(lastChain.data).map(w => w[0].length)
      let i = 0;

      // TODO: make helper function to reduce code-reuse
      line = lastChain.data
        .replace(WORD_REGEX, str => data.includes(i++) ? `\u200B` : str)
        .split('\u200B')
        .map(s => ({
          type: 'string',
          value: s,
        }));
      const lengths = data
        .map((d, i) => ({
          type: 'count',
          index: d,
          key: i,
          value: words[d],
        }));

      chain.addLink(pid, {
        type: 'tamper',
        kind: 'censor',
        data: {
          line: _.chain(line)
            .zip(lengths)
            .flatten()
            .compact()
            .filter(f => f.type !== 'string' || f.value)
            .value(),
          indexes: data,
        },
      });

      this.lastEdit[pid] = Date.now();
      this.redistribute();

      break;

    // Handle passing of lines
    case 'redacted:line':
      if(!chain || expectedType !== 'line')
        return;

      if(typeof data !== 'string')
        return;

      line = Sanitize.str(data);

      if(line.length < 1 || line.length > 256)
        return;

      this.lastEdit[pid] = Date.now();
      chain.addLink(pid, {type: 'line', data: line});

      if(this.autonomous) {

        const rng = gamemode.truncate === 'random' && gamemode.censor === 'random';

        if (rng && Math.random() < 0.5 || gamemode.truncate === 'random') {

          // Normally distribute random counts
          const low = 1;
          const high = Math.floor(ink/COST.truncate);
          const middle = (high + low) / 2;
          const range = (high - low) / 2;

          const count = Math.min(Math.max(low, Math.round(Random.gauss(range, middle))), high);

          const prevLine = getWords(line);
          const end = prevLine[prevLine.length - count];

          // Artificially create link
          chain.addLink('', {
            type: 'tamper',
            kind: 'truncate',
            data: {
              line: line.slice(0, end.index),
              length: line.length - end.index,
              count,
            }
          });

        } else { // censor === 'random'

          // Normally distribute random counts
          const low = 1;
          const high = Math.floor(ink/COST.censor);
          const middle = (high + low) / 2;
          const range = (high - low) / 2;

          const prevLine = getWords(line);

          const count = Math.min(Math.max(low, Math.round(Random.gauss(range, middle))), high);
          const indexes = _.shuffle(_.range(prevLine.length)).slice(0, count);

          const words = prevLine.map(w => w.length)
          let i = 0;

          const newLine = line
            .replace(WORD_REGEX, str => indexes.includes(i++) ? `\u200B` : str)
            .split('\u200B')
            .map(s => ({
              type: 'string',
              value: s
            }));
          const lengths = indexes
            .map((d, i) => ({
              type: 'count',
              index: d,
              key: i,
              value: words[d],
            }));

          // Artificially create link
          chain.addLink('', {
            type: 'tamper',
            kind: 'censor',
            data: {
              line: _.chain(newLine)
                .zip(lengths)
                .flatten()
                .compact()
                .filter(f => f.type !== 'string' || f.value)
                .value(),
              indexes,
            },
          });
        }
      }

      this.redistribute();

      break;

    case 'redacted:done':
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

  constructLine(corrupted, edits, stage=0) {
    if(stage > this.config.edits) {
      if(corrupted.kind === 'censor') {
        return {
          line: corrupted.data.line
            .map(l => l.type === 'count' ? {
              type: 'word',
              value: (edits.data.find(e => e[0] === l.index) || [0, ''])[1],
            } : {
              type: 'punctuation',
              value: l.value,
            })
        }
      } else if (corrupted.kind === 'truncate') {
        return {
          line: [{
            type: 'punctuation',
            value: corrupted.data.line,
          }, {
            type: 'word',
            value: edits.data,
          }],
        };
      } else {
        return { type: 'string', line: '' };
      }
    } else {
      if(corrupted.kind === 'censor') {
        return {
          line: [{
            type: 'punctuation',
            value: corrupted.data.line
              .map(l => l.type === 'count' ? (edits.data.find(e => e[0] === l.index) || [0, ''])[1] : l.value)
              .join(''),
          }],
        };
      } else if (corrupted.kind === 'truncate') {
        return {
          line: [{
            type: 'punctuation',
            value: corrupted.data.line + edits.data,
          }],
        };
      } else {
        return { type: 'string', line: '' };
      }
    }
  }

  compileStories() {
    if (!this.compiled)
      this.compiled = this.chains.map(s =>
        _.chunk(_.zip(s.chain, s.editors), 3)
        .map(([[original, author], [corrupted, tamperer], [edits, editor]]) => ({
          data: this.constructLine(corrupted, edits, 2),
          editors: this.config.anonymous
            ? ['', '', '']
            : [author, tamperer, editor],
        }))
      );
    return this.compiled;
  }

  getPlayerState(pid) {
    const story = this.chains.find(s => s.editor === pid);
    const done = this.getGameProgress() === 1;

    const link = story && story.chain.slice(-1)[0];
    return story ? {
      id: pid,
      state: 'EDITING',
      isLastLink: story.chain.length >= this.config.numLinks - 3,
      link: link && link.type === 'repair' ? {
        ...link,
        data: this.constructLine(...story.chain.slice(-2), 1),
      } : link,
    } : {
      id: pid,
      liked: this.chains.map(s => s.likes[pid]),
      state: done ? 'READING' : 'WAITING',
    };
  }

  getState() {
    const hasChain = this.chains
      .filter(s => s.editor)
      .reduce((obj, i) => ({
        ...obj,
        [i.editor]: this.icons[this.phases[i.chain.length % 3]],
      }), {});

    const progress = this.getGameProgress();
    return {
      // players who are writing have pencil icons, players who are not have a clock icon
      icons: this.players.reduce((obj, p) => ({
        ...obj,
        [p]: progress === 1 ?
          (this.finishedReading[p] ? 'check' : 'clock') :
          (hasChain[p] || 'clock')
      }), {}),
      progress,
      gamemode: this.config.gamemode,
      ink: this.config.ink,
      likes: this.chains.map(s => _.size(_.filter(s.likes, l => l))),
      isComplete: progress === 1,
    };
  }
};

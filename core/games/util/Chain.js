const _ = require('lodash');

module.exports = class Chain {
  constructor(numPlayers, length) {
    this.numPlayers = numPlayers;

    // Track how many time players contribute
    this.collaborators = {};

    // Id of the last editor
    this.lastEditor = '';

    // Id of the current editor
    this.editor = '';

    // List of lines in the chain
    this.chain = [];

    // List of editors
    this.editors = [];

    // Players that like this story
    this.likes = {};
  }

  avgEdits() {
    return _.sum(_.values(this.collaborators)) / this.numPlayers;
  }

  addLink(pid, link) {
    this.lastEditor = this.editor;
    this.collaborators[pid] = (this.collaborators[pid] || 0) + 1;
    this.chain.push(link);
    this.editors.push(pid);
    this.editor = '';
  }
};

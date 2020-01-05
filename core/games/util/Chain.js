const _ = require('lodash');

class Chain {
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

  save() {
    return {
      version: 1,
      numPlayers: this.numPlayers,
      collaborators: this.collaborators,
      lastEditor: this.lastEditor,
      editor: this.editor,
      chain: this.chain,
      type: this.type,
      editors: this.editors,
      likes: this.likes,
    };
  }

  restore(blob) {
    if (blob.version !== 1)
      return;

    this.collaborators = blob.collaborators;
    this.lastEditor = blob.lastEditor;
    this.editor = blob.editor;
    this.chain = blob.chain;
    this.editors = blob.editors;
    this.likes = blob.likes;
    this.type = blob.type;
  }

  avgEdits() {
    return _.sum(_.values(this.collaborators)) / this.numPlayers;
  }

  addLink(pid, link) {
    this.lastEditor = this.editor;
    if(pid)
      this.collaborators[pid] = (this.collaborators[pid] || 0) + 1;
    this.chain.push(link);
    this.editors.push(pid);
    this.editor = '';
  }
};

// restore a chain from save data
Chain.restore = blob => {
  const c = new Chain(blob.numPlayers);
  c.restore(blob);
  return c;
};

module.exports = Chain;
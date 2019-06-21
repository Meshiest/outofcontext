const _ = require('lodash');

module.exports = {
  str: s => s.replace(/[\u200B-\u200D\uFEFF\n\t]/g, '').trim(),
};
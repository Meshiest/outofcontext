const _ = require('lodash');

module.exports = {
  str: s => (typeof s === 'string' ? s : '').replace(/[\u200B-\u200D\uFEFF\n\t]/g, '').trim(),
};
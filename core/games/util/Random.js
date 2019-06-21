const _ = require('lodash');

module.exports = {
  // Gauss distribution from -1 to 1
  gauss(range=1, middle=0) {
    return (_.sum(_.times(12, () => _.random()))/6.0 - 1) * range + middle;
  }
};
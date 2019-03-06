const fs = require('fs');
const ohm = require('ohm-js');

const grammar = ohm.grammar(fs.readFileSync('syntax/stonescript.ohm'));

module.exports = (text) => {
  return grammar.match(text).succeeded();
};

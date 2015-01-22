var htmlclean = require('htmlclean');
var commonParser = require('./common');

exports.init = function(grunt) {
  return commonParser.init(grunt, {
    type: 'html',
    factoryParser: getCode
  });
};

function getCode(data) {
  data = htmlclean(data).replace(/(\"|\'|\\)/g, '\\$1');
  return '"' + data + '"';
}

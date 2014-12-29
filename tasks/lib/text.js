var commonParser = require('./common');

exports.init = function(grunt) {
  return commonParser.init(grunt, {
    type: 'html',
    factoryParser: getCode
  });
};

function getCode(data) {
  data = data.split(/\r\n|\r|\n/)
    .map(function(line) {
      return line.replace(/\\/g, '\\\\');
    })
    .join('\n')
    .replace(/\"/g, '\\\"');
  return '"' + data + '"';
}

var commonParser = require('./common');

exports.init = function(grunt) {
  return commonParser.init(grunt, {
    type: 'tpl',
    factoryParser: function(data) {
      return '"' + data.replace(/\"/g, '\\\"') + '"';
    }
  });
};

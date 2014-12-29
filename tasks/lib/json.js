var commonParser = require('./common');

exports.init = function(grunt) {
  return commonParser.init(grunt, {
    type: 'json',
    factoryParser: function(data) {
      return data || '{}';
    }
  });
};

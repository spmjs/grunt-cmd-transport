var fs = require('fs');

exports.file = {
  expand: function(test) {
    var exist = fs.existsSync('test/expected/expand-debug.js');
    test.ok(exist, "file should exist");
    test.done();
  }
};

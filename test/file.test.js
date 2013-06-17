var fs = require('fs');
var should = require('should');

describe('file', function() {
  it('expand', function() {
    var exist = fs.existsSync('test/expected/expand-debug.js');
    should.exist(exist);
  });
});

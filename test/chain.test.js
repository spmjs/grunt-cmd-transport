var grunt = require('grunt');
var ast = require('cmd-util').ast;

exports.chain = {
  setUp: function(done) {
    done();
  },
  chain4: function(test) {
    var actual = grunt.file.read('tmp/chain/chain-dep4.js');
    var parsed = ast.parseFirst(actual);
    test.equal(parsed.id, 'cmd/chain/1.0.0/chain-dep4', 'should get the rgith id');
    test.deepEqual(parsed.dependencies, ['./chain-dep3', './chain-dep2', './chain-dep1', './chain-dep0'], 'should get the right dependencies');
    test.done();
  },
};

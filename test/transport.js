var fs = require('fs');
var path = require('path');
var should = require('should');
var css2js = require('../tasks/lib/css2js').css2js;

var base = path.resolve('test/cases');
var expected = path.resolve('test/expected');
var dirs = fs.readdirSync(base);

describe('file', function() {
  it('expand', function() {
    var exist = fs.existsSync('test/expected/expand-debug.js');
    should.exist(exist);
  });

  it('css2js', function() {
    var code = css2js('body{margin:0}', 'a', {});
    code.should.eql('define("a", [], function() {seajs.importStyle(\'body{margin:0}\')});');
  });

  dirs.forEach(function(dir) {
    var files = readDirs(path.join(base, dir)).filter(function(file) {
      return /\.expect$/.test(file);
    });
    if (files.length) {
      it('should test ' + dir, function() {
        files.forEach(function(file) {
          var actual = fs.readFileSync(path.join(base, dir, file))
            .toString().replace(/\r|\\r/g, '');
          var expect = fs.readFileSync(path.join(expected, dir, file.replace(/\.expect$/, '')))
            .toString().replace(/\r|\\r/g, '');
          expect.should.eql(actual);
        });
      });
    }
  });
});

function readDirs(dir) {
  var result = [];
  fs.readdirSync(dir)
    .forEach(function(file) {
      var sub = path.join(dir, file);
      if (fs.statSync(sub).isDirectory()) {
        result = result.concat(readDirs(sub).map(function(subFile) {
          return path.join(file, subFile);
        }));
      } else {
        result.push(file);
      }
    });
  return result;
}

var fs = require('fs');
var path = require('path');
var should = require('should');

var base = path.resolve('test/cases');
var expected = path.resolve('test/expected');
var dirs = fs.readdirSync(base);

describe('file', function() {
  it('expand', function() {
    var exist = fs.existsSync('test/expected/expand-debug.js');
    should.exist(exist);
  });

  it('should test coverage', function() {
    var code = fs.readFileSync(path.join(expected, 'project-cov/a-cov.js')).toString();
    code.should.match(/__cov_.{23}/);
    code.should.match(/define\('family\/name\/a-cov',\['.\/a-cov.handlebars','.\/a-cov.json','/);
    code.should.match(/'.\/a-cov.css','.\/b-cov','arale\/base\/1.1.1\/base'/);

    code = fs.readFileSync(path.join(expected, 'project-cov/a-cov.html.js')).toString();
    code.should.match(/__cov_.{23}/);
    code.should.match(/define\('family\/name\/a-cov.html',\[\]/);

    code = fs.readFileSync(path.join(expected, 'project-cov/a-cov.handlebars.js')).toString();
    code.should.match(/__cov_.{23}/);
    code.should.match(/define\('family\/name\/a-cov.handlebars',\['gallery\/handlebars\/1.0.2\/runtime'\]/);

    fs.existsSync(path.join(expected, 'project-cov/a-cov.css')).should.be.false;
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

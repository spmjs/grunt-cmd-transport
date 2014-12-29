exports.init = function(grunt, options) {
  var format = require('util').format;
  var ast = require('cmd-util').ast;
  var md5 = require('./util').md5;
  var type = options.type;
  var factoryParser = options.factoryParser;
  var depParser = options.depParser;
  var regType = new RegExp('.' + type + '$');
  var retTypeJs = new RegExp('.' + type + '.js$');

  var exports = {};

  exports[type + 'Parser'] = function(fileObj, options) {
    var dest, id = unixy(options.idleading + fileObj.name.replace(/\.js$/, ''));
    var data = fileObj.srcData || grunt.file.read(fileObj.src);
    var deps = depParser ? depParser(data, options) : '';
    var factory = factoryParser ? factoryParser(data, options) : '{}';
    var file = {
      contents: format('define("%s", [%s], %s)', id, deps, factory),
      dest: fileObj.dest + '.js'
    };

    // create .{type}.js
    data = ast.modify(file.contents, {
      id: id
    }).print_to_string(options.uglify);
    writeFile(data, file.dest);

    // create debug file xxx-debug.{type}.js
    if (options.debug) {
      dest = file.dest.replace(retTypeJs, '-debug.' + type + '.js');
      data = ast.modify(file.contents, {
        id: id.replace(regType, '-debug.' + type)
      }).print_to_string(options.uglify);
      writeFile(data, dest);
    }

    // create hash file xxx-{hash}.{type}.js
    if (options.hash) {
      var hash = md5(factory);
      dest = file.dest.replace(retTypeJs, '-' + hash + '.' + type + '.js');
      data = ast.modify(file.contents, {
        id: id.replace(regType, '-' + hash + '.' + type)
      }).print_to_string(options.uglify);
      writeFile(data, dest);
    }
  };
  return exports;

  function writeFile(data, dest) {
    grunt.log.writeln('transport ' + dest + ' created');
    grunt.file.write(dest, data + '\n');
  }
};

function unixy(uri) {
  return uri.replace(/\\/g, '/');
}

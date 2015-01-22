exports.init = function(grunt, options) {
  var extname = require('path').extname;
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
    var filepath, id = unixy(options.idleading + fileObj.name.replace(/\.js$/, ''));
    var data = fileObj.srcData || grunt.file.read(fileObj.src);
    var hash = md5(data);
    var deps = depParser ? depParser(data, options) : '';
    var factory = factoryParser ? factoryParser(data, options, fileObj) : '{}';
    var file = {
      contents: format('define("%s", [%s], %s)', id, deps, factory),
      dest: fileObj.dest + '.js'
    };

    if (!options.hash) {

      // create .{type}.js
      data = ast.modify(file.contents, {
        id: id
      }).print_to_string(options.uglify);
      filepath = file.dest;
      writeFile(data, filepath);
    } else {

      // create hash file xxx-{hash}.{type}.js
      if (options.hash) {
        filepath = file.dest.replace(retTypeJs, '-' + hash + '.' + type + '.js');
        data = ast.modify(file.contents, {
          id: id.replace(regType, '-' + hash + '.' + type)
        }).print_to_string(options.uglify);
        writeFile(data, filepath);
      }
    }

    // create debug file xxx-debug.{type}.js
    if (options.debug) {
      data = ast.modify(data, addDebug).print_to_string(options.uglify);
      filepath = filepath.replace(retTypeJs, '-debug.' + type + '.js');
      writeFile(data, filepath);
    }

// {
//         id: id.replace(regType, '-debug.' + type),
//         dependencies: function(id) {
//           return id + '-debug';
//         },
//         require: function(id) {
//           return id + '-debug';
//         }
//       }
    function addDebug(v) {
      var ext = extname(v);
      if (ext && options.parsers[ext]) {
        return v.replace(new RegExp('\\' + ext + '$'), '-debug' + ext);
      } else {
        return v + '-debug';
      }
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

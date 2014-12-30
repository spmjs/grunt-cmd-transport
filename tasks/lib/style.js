
exports.init = function(grunt) {
  var iduri = require('cmd-util').iduri;
  var format = require('util').format;
  var css = require('cmd-util').css;
  var md5 = require('./util').md5;
  var join = require('path').join;
  var dirname = require('path').dirname;

  var exports = {};

  // the real css parser
  exports.cssParser = function(fileObj, options) {
    var data = fileObj.srcData || grunt.file.read(fileObj.src);

    var dest = fileObj.dest;
    var ret = parseCss(data);
    var id = unixy(options.idleading + fileObj.name);
    var code = format('/*! define %s */\n%s', id, ret);
    writeFile(code, dest);

    if (options.debug) {
      dest = fileObj.dest.replace(/\.css$/, '-debug.css');
      ret = parseCss(data, addDebug);
      id = unixy(options.idleading + fileObj.name.replace(/\.css$/, '-debug.css'));
      code = format('/*! define %s */\n%s', id, ret);
      writeFile(code, dest);
    }

    if (options.hash) {
      var hash = md5(data);
      dest = fileObj.dest.replace(/\.css$/, '-' + hash + '.css');
      ret = parseCss(data, addHash);
      id = unixy(options.idleading + fileObj.name.replace(/\.css$/, '-' + hash + '.css'));
      code = format('/*! define %s */\n%s', id, ret);
      writeFile(code, dest);
    }

    function addDebug(node) {
      node.id = node.id.replace(/\.css$/, '-debug.css');
    }

    function addHash(node) {
      var code;
      if (node.id.charAt(0) === '.') {
        code = grunt.file.read(join(dirname(fileObj.src), node.id));
      } else {
        var i = 0, path;
        while(path = options.paths[i++]) {
          var file = join(path, node.id);
          if (grunt.file.exists(file)) {
            code = grunt.file.read(file);
            break;
          }
        }
        if (!code) {
          grunt.log.warn('fail find file ' + node.id);
        }
      }
      var hash = md5(code);
      node.id = node.id.replace(/\.css$/, '-' + hash + '.css');
    }

    function parseCss(data, editId) {
      if (!editId) {
        editId = function() {};
      }

      return css.stringify(css.parse(data)[0].code, function(node) {
        if (node.type === 'import' && node.id) {
          if (node.id.charAt(0) === '.') {
            editId(node);
            return node;
          }
          if (/^https?:\/\//.test(node.id)) {
            return node;
          }
          if (!iduri.isAlias(options, node.id)) {
            grunt.log.warn('alias ' + node.id + ' not defined.');
          } else {
            node.id = iduri.parseAlias(options, node.id);
            if (!/\.css$/.test(node.id)) {
              node.id += '.css';
            }
            editId(node);
            return node;
          }
        }
      });
    }
  };

  return exports;

  function writeFile(data, dest) {
    grunt.log.writeln('transport ' + dest + ' created');
    grunt.file.write(dest, data + '\n');
  }
};

// helpers
function unixy(uri) {
  return uri.replace(/\\/g, '/');
}

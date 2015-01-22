
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
    var id, filepath, data = fileObj.srcData || grunt.file.read(fileObj.src);

    if (!options.hash) {

      var ret = parseCss(data);
      id = unixy(options.idleading + fileObj.name);
      var code = format('/*! define %s */\n%s', id, ret);
      filepath = fileObj.dest;
      writeFile(code, filepath);
    } else {

      var hash = md5(data);
      ret = parseCss(data, addHash);
      id = unixy(options.idleading + fileObj.name.replace(/\.css$/, '-' + hash + '.css'));
      code = format('/*! define %s */\n%s', id, ret);
      filepath = fileObj.dest.replace(/\.css$/, '-' + hash + '.css');
      writeFile(code, filepath);
    }

    if (options.debug) {
      ret = parseCss(data, addDebug);
      id = id.replace(/\.css$/, '-debug.css');
      code = format('/*! define %s */\n%s', id, ret);
      filepath = filepath.replace(/\.css$/, '-debug.css');
      writeFile(code, filepath);
    }

    function addDebug(node) {
      node.id = node.id.replace(/\.css$/, '-debug.css');
    }

    function addHash(node) {
      if (node.id.charAt(0) === '.') {
        var code = grunt.file.read(join(dirname(fileObj.src), node.id));
        node.id = node.id.replace(/\.css$/, '-' + md5(code) + '.css');
      }
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

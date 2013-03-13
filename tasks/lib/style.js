var format = require('util').format;
var cleancss = require('clean-css');
var ast = require('cmd-util').ast;
var iduri = require('cmd-util').iduri;


exports.init = function(grunt) {
  var exports = {};

  exports.css2jsParser = function(fileObj, options) {
    // transport css to js
    var data = grunt.file.read(fileObj.src);
    var id = iduri.idFromPackage(
      options.pkg, fileObj.name, options.format
    ) + '.js';

    data = css2js(data, id);
    data = ast.getAst(data).print_to_string(options.uglify);
    var dest = fileObj.dest + '.js';
    grunt.file.write(dest, data);

    if (!options.debug) {
      return;
    }
    dest = dest.replace(/\.js$/, '-debug.js');
    grunt.log.writeln('Creating debug file: ' + dest);

    data = ast.modify(data, function(v) {
      return v + '-debug';
    });
    data = data.print_to_string(options.uglify);
    grunt.file.write(dest, data);
  };

  // the real css parser
  exports.cssParser = function(fileObj, options) {
    // transport css to something like
    // /*! {% define "id" %} */
    // /*! {% import "dependency" %} */

    var data = grunt.file.read(fileObj.src);

    var lines = data.split(/\r\n|\r|\n/);
    var regex = /^@import\s+url\(([^;\n]+)\);\s*$/;
    lines = lines.map(function(line) {
      var m = line.match(regex);
      if (!m) return line;
      var dep = m[1];
      dep = dep.replace(/^('|")/, '');
      dep = dep.replace(/('|")$/, '');

      if (dep.charAt(0) !== '.' && !iduri.isAlias(options.pkg, dep)) {
        grunt.log.warn('alias ' + dep + ' not defined.');
      } else {
        dep = iduri.parseAlias(options.pkg, dep);
      }

      return format('/*! {% import "%s" %} */', dep);
    });

    data = lines.join(grunt.util.linefeed);

    var id = iduri.idFromPackage(options.pkg, fileObj.name, options.format);
    id = format('/*! {% define "%s" %} */', id)
    data = [id, data].join(grunt.util.linefeed);
    grunt.file.write(fileObj.dest, data);

    // create a debug file
    lines = data.split(/\r\n|\r|\n/);
    regex = /^(\/\*\!\s*\{%\s*\w+\s+)(\'|\")(.*?)\2(\s*%\}\s*\*\/)$/;
    lines = lines.map(function(line) {
      var m = line.match(regex);
      if (!m) return line;
      line = line.replace(regex, function(m, m1, m2, m3, m4) {
        return m1 + m2 + m3.replace(/(\.css)?$/, '-debug.css') + m2 + m4;
      });
      return line;
    });
    data = lines.join(grunt.util.linefeed);
    var dest = fileObj.dest.replace(/\.css$/, '-debug.css');
    grunt.file.write(dest, data);
  };

  return exports;
};


// helpers
function css2js(code, id) {
  // transform css to js
  // spmjs/spm#581
  var tpl = [
    'define("%s", [], function() {',
    'function importStyle(cssText) {',
    'var element = document.createElement("style");',
    'doc.getElementsByTagName("head")[0].appendChild(element);',
    'if (element.styleSheet) {',
    'element.styleSheet.cssText = cssText;',
    '} else {',
    'element.appendChild(doc.createTextNode(cssText));',
    '}',
    '}',
    "importStyle('%s')",
    '});'
  ].join('\n');

  code = cleancss.process(code, {
    keepSpecialComments: 0,
    removeEmpty: true
  });
  // spmjs/spm#651
  code = code.replace(/\\0/g, '\\\\0');
  code = format(tpl, id, code.replace(/\'/g, '\\\''));

  return code;
}

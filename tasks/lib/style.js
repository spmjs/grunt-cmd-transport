var format = require('util').format;
var cleancss = require('clean-css');
var ast = require('cmd-util').ast;
var iduri = require('cmd-util').iduri;
var css = require('cmd-util').css;


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
    var data = grunt.file.read(fileObj.src);
    data = css.parse(data);

    grunt.log.writeln('Transport ' + fileObj.src + ' -> ' + fileObj.dest);
    var ret = css.stringify(data[0].code, function(node) {
      if (node.type === 'import' && node.id) {
        if (node.id.charAt(0) === '.') {
          return node;
        }
        if (!iduri.isAlias(options.pkg, node.id)) {
          grunt.log.warn('alias ' + node.id + ' not defined.');
        } else {
          node.id = iduri.parseAlias(options.pkg, node.id);
          if (!/\.css$/.test(node.id)) {
            node.id += '.css';
          }
          return node;
        }
      }
    });

    var id = iduri.idFromPackage(options.pkg, fileObj.name, options.format);
    var banner = format('/*! define %s */', id);
    grunt.file.write(fileObj.dest, [banner, ret].join('\n'));

    var dest = fileObj.dest.replace(/\.css$/, '-debug.css');
    grunt.log.writeln('Creating debug file: ' + dest);

    ret = css.stringify(data[0].code, function(node) {
      if (node.type === 'import' && node.id) {
        var alias = node.id;
        if (alias.charAt(0) === '.') {
          node.id = alias.replace(/(\.css)?$/, '-debug.css');
          return node;
        }
        alias = iduri.parseAlias(options.pkg, alias);
        if (/\.css$/.test(alias)) {
          node.id = alias.replace(/\.css$/, '-debug.css');
        } else {
          node.id = alias + '-debug.css';
        }
        return node;
      }
    });
    id = id.replace(/(\.css)?$/, '-debug.css');
    banner = format('/*! define %s */', id);
    grunt.file.write(dest, [banner, ret].join('\n'));
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

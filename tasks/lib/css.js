// transform css to js
// spmjs/spm#581

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
    var dest = dest.replace(/\.js$/, '-debug.js');
    grunt.log.writeln('Creating debug file: ' + dest);

    data = ast.modify(data, function(v) {
      return v + '-debug';
    });
    data = data.print_to_string(options.uglify);
    grunt.file.write(dest, data);
  }

  return exports;
}


// helpers
function css2js(code, id) {

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
};

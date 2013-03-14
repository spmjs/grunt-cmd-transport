exports.init = function(grunt) {

  var format = require('util').format;
  var iduri = require('cmd-util').iduri;
  var ast = require('cmd-util').ast;

  var exports = {};

  exports.handlebarsParser = function(fileObj, options) {
    var dest = fileObj.dest + '.js';
    grunt.log.writeln('Transport ' + fileObj.src + ' -> ' + dest);

    var handlebars = require('handlebars');

    // id for template
    var id = iduri.idFromPackage(options.pkg, fileObj.name, options.format) + '.js';

    // handlebars alias
    var alias = iduri.parseAlias(options.pkg, 'handlebars');

    var template = [
      'define("%s", ["%s"], function(require, exports, module) {',
      'var Handlebars = require("%s");',
      'var template = Handlebars.template;',
      'module.exports = template(',
      '%s',
      ');',
      '})'
    ].join('\n');

    var data = grunt.file.read(fileObj.src);

    // compile code
    var props = {};
    props.knownHelpers = options.knownHelpers || [];
    props.knownHelpersOnly = options.knownHelpersOnly;
    if (options.knownData) {
      props.data = true;
    }
    var code = handlebars.precompile(data, props);

    var ret = format(template, id, alias, alias, code);
    var astCache = ast.getAst(ret);

    data = astCache.print_to_string(options.uglify);
    grunt.file.write(dest, data);

    // create debug file
    if (!options.debug) {
      return;
    }
    dest = dest.replace(/\.js$/, '-debug.js');
    grunt.log.writeln('Creating debug file: ' + dest);

    astCache = ast.modify(astCache, function(v) {
      return v + '-debug';
    });
    data = astCache.print_to_string(options.uglify);
    grunt.file.write(dest, data);
  };

  return exports;
};

/*
 * grunt-cmd-transport
 * https://github.com/spmjs/grunt-cmd-transport
 *
 * Copyright (c) 2013 Hsiaoming Yang
 * Licensed under the MIT license.
 */


var path = require('path');
var cmd = require('cmd-util');
var ast = cmd.ast;
var iduri = cmd.iduri;
var css = require('./lib/css');

module.exports = function(grunt) {

  var dependency = require('./lib/dependency').init(grunt);

  var data, astCache;
  grunt.registerMultiTask('transport', 'Transport everything into cmd.', function() {

    var options = this.options({
      paths: ['sea-modules'],
      format: '{{family}}/{{name}}/{{version}}/{{filename}}',

      // if create a debug file
      debug: true,

      pkg: 'package.json',

      // define parsers
      filetypes: {
        '.js': 'javascript',
        '.css': 'css',
        '.tpl': 'handlebars'
      },

      // output beautifier
      uglify: {
        beautify: true,
        comments: true
      }
    });

    if (grunt.util._.isString(options.pkg)) {
      options.pkg = grunt.file.readJSON(options.pkg);
    }

    var id, fname, destfile, debugfile, data;
    this.files.forEach(function(fileObj) {
      fileObj.src.forEach(function(fpath) {

        // get the right filename and filepath
        if (fileObj.cwd) {
          // not expanded
          fname = fpath;
          fpath = path.join(fileObj.cwd, fpath);
        } else {
          fname = path.relative(fileObj.orig.cwd, fpath);
        }

        var extname = path.extname(fpath);
        var type = options.filetypes[extname];
        if (!type) {
          return;
        }

        destfile = path.join(fileObj.dest, fname);
        if (extname !== '.js') {
          destfile += '.js';
        }
        debugfile = destfile.replace(/\.js$/, '-debug.js');
        grunt.log.writeln('Transporting "' + fpath + '" => ' + destfile);

        id = iduri.idFromPackage(options.pkg, fname, options.format);
        data = grunt.file.read(fpath);

        if (type === 'javascript') {
          // transport pure js
          astCache = ast.getAst(data);

          if (ast.parseFirst(astCache).id) {
            grunt.log.warn('found id in "' + fpath + '"');
            grunt.file.write(destfile, data);
            return;
          }
          var deps = dependency.get(fpath, options);
          if (deps.length) {
            grunt.log.writeln('found dependencies ' + deps);
          } else {
            grunt.log.writeln('found no dependencies');
          }

          astCache = ast.modify(astCache, {
            id: id,
            dependencies: deps,
            require: function(v) {
              return iduri.parseAlias(options.pkg, v);
            }
          });
          data = astCache.print_to_string(options.uglify);
          grunt.file.write(destfile, data);

          createDebug(astCache);

        } else if (type === 'css') {
          // transport css to js
          data = css(data, id);
          data = ast.getAst(data).print_to_string(options.uglify);
          grunt.file.write(destfile, data);
          createDebug(data);
        } else if (type == 'handlebars') {
        }

        function createDebug(data) {
          if (!options.debug) {
            return;
          }
          grunt.log.writeln('Creating debug file: ' + debugfile);

          data = ast.modify(data, function(v) {
            return v + '-debug';
          });
          data = data.print_to_string(options.uglify);
          grunt.file.write(debugfile, data);
        }

      });
    });
  });
};

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
        debugfile = destfile.replace(
          new RegExp('\\' + extname + '$'),
          '-debug' + extname
        );
        grunt.log.writeln('Transporting "' + fpath + '" => ' + destfile);

        id = iduri.idFromPackage(options.pkg, fname, options.format);

        // transport pure js
        if (type === 'javascript') {
          data = grunt.file.read(fpath);
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

          if (options.debug) {
            grunt.log.writeln('Creating debug file: ' + debugfile);

            astCache = ast.modify(astCache, function(v) {
              return v + '-debug';
            });
            data = astCache.print_to_string(options.uglify);

            grunt.file.write(debugfile, data);
          }

        } else if (type === 'css') {

        }
      });
    });
  });
};

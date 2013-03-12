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

      // create a debug file or not
      debug: true,

      pkg: 'package.json',

      // define parsers
      parsers: {},

      // output beautifier
      uglify: {
        beautify: true,
        comments: true
      }
    });

    if (grunt.util._.isString(options.pkg)) {
      options.pkg = grunt.file.readJSON(options.pkg);
    }

    // default parsers
    var parsers = {
      '.js': jsParser,
      '.css': cssParser,
    };

    var fname, destfile;
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
        destfile = path.join(fileObj.dest, fname);

        // fpath, fname, dest
        var extname = path.extname(fpath);

        var fileparsers = options.parsers[extname] || parsers[extname];
        if (!fileparsers || fileparsers.length === 0) {
          grunt.file.copy(fpath, destfile);
          return;
        }
        if (!Array.isArray(fileparsers)) {
          fileparsers = [fileparsers];
        }
        fileparsers.forEach(function(fn) {
          fn({
            src: fpath,
            name: fname,
            dest: destfile
          }, options);
        });
      });
    });
  });

  function jsParser(fileObj, options) {
    var data = grunt.file.read(fileObj.src);
    var astCache = ast.getAst(data);

    if (ast.parseFirst(astCache).id) {
      grunt.log.warn('found id in "' + fileObj.src + '"');
      grunt.file.write(fileObj.dest, data);
      return;
    }
    var deps = dependency.get(fileObj.src, options);
    if (deps.length) {
      grunt.log.writeln('found dependencies ' + deps);
    } else {
      grunt.log.writeln('found no dependencies');
    }

    astCache = ast.modify(astCache, {
      id: iduri.idFromPackage(options.pkg, fileObj.name, options.format),
      dependencies: deps,
      require: function(v) {
        return iduri.parseAlias(options.pkg, v);
      }
    });
    data = astCache.print_to_string(options.uglify);
    grunt.file.write(fileObj.dest, data);

    if (!options.debug) {
      return;
    }
    var dest = fileObj.dest.replace(/\.js$/, '-debug.js');
    grunt.log.writeln('Creating debug file: ' + dest);

    astCache = ast.modify(data, function(v) {
      return v + '-debug';
    });
    data = astCache.print_to_string(options.uglify);
    grunt.file.write(dest, data);
  }

  function cssParser(fileObj, options) {
    // transport css to js
    var data = grunt.file.read(fileObj.src);
    var id = iduri.idFromPackage(
      options.pkg, fileObj.name, options.format
    ) + '.js';

    data = css(data, id);
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
};

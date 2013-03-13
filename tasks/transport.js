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

  var script = require('./lib/script').init(grunt);
  var style = require('./lib/style').init(grunt);

  // default parsers, add more parsers here
  var parsers = {
    '.js': [script.jsParser],
    '.css': [style.cssParser, style.css2jsParser],
  };

  var data, astCache;
  grunt.registerMultiTask('transport', 'Transport everything into cmd.', function() {

    var options = this.options({
      paths: ['sea-modules'],
      format: '{{family}}/{{name}}/{{version}}/{{filename}}',

      // create a debug file or not
      debug: true,

      // path or object
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
        if (grunt.file.isDir(fpath)) {
          grunt.file.mkdir(fpath);
          return;
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
};

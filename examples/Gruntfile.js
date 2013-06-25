/*
 * grunt-cmd-transport
 * https://github.com/spmjs/grunt-cmd-transport
 *
 * Copyright (c) 2013 Hsiaoming Yang
 * Licensed under the MIT license.
 */


// https://github.com/spmjs/grunt-cmd-transport/issues/12

module.exports = function(grunt) {
  var css2jsParser = require('../tasks/lib/style').init(grunt).css2jsParser;
  var jsParser = require('../tasks/lib/script').init(grunt).jsParser;

  grunt.initConfig({
    transport: {

      // single file without any dependencies
      single: {
        // learn file object at:
        // http://gruntjs.com/configuring-tasks#building-the-files-object-dynamically
        files: [{
          cwd: 'single',
          src: '**/*',
          filter: 'isFile',
          dest: 'tmp/single'
        }]
      },

      // single file with cmd id format
      cmdid: {
        options: {
          // you can read these from a package.json
          idleading: 'family/name/1.0.0/'
        },
        files: [{
          cwd: 'cmdid',
          src: '*',
          dest: 'tmp/cmdid'
        }]
      },

      // relative dependencies
      relative: {
        files: [{
          cwd: 'relative',
          src: '*',
          dest: 'tmp/relative'
        }]
      },

      // nested relative dependencies
      nested: {
        files: [{
          cwd: 'nested',
          src: '**/*',
          filter: 'isFile',
          dest: 'tmp/nested'
        }]
      },

      // rely on other modules
      rely: {
        options: {
          paths: ['assets']
        },
        files: [{
          cwd: 'rely-arale',
          src: '*',
          dest: 'tmp/rely'
        }]
      },

      // reply on other modules (with alias)
      alias: {
        options: {
          paths: ['assets'],
          alias: {
            'foo': 'arale/class/foo'
          }
        },
        files: [{
          cwd: 'alias',
          src: '*',
          dest: 'tmp/alias'
        }]
      },

      // parsing css
      css: {
        options: {
          alias: {
            'button': 'alice/button/1.0.0/button.css'
          }
        },
        files: [{
          cwd: 'css',
          src: '*.css',
          dest: 'tmp/css'
        }]
      },

      // parsing html into js
      text: {
        files: [{
          cwd: 'text',
          src: '*.html',
          dest: 'tmp/text'
        }]
      },

      // parsing handlebars into js
      handlebars: {
        files: [{
          cwd: 'handlebars',
          src: '*',
          dest: 'tmp/handlebars'
        }]
      },

      // parsing tpl into js
      tpl: {
        files: [{
          cwd: 'tpl',
          src: '*',
          dest: 'tmp/tpl'
        }]
      },

      css2js: {
        options: {
          parsers: {
            '.css': [css2jsParser]
          }
        },
        files: [{
          cwd: 'css2js',
          src: '*.css',
          dest: 'tmp/css2js'
        }]
      },

      style: {
        options: {
          parsers: {
            '.css': [css2jsParser],
            '.js': [jsParser]
          },
          styleBox: true,
          idleading: 'arale/widget/1.0.0/'
        },
        files: [{
          cwd: 'style',
          src: '*',
          dest: 'tmp/style'
        }]
      }
    }
  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('../tasks');
  // for real project:
  // grunt.loadNpmTasks('grunt-cmd-transport')

  grunt.registerTask('default', ['transport']);
};

/*
 * grunt-cmd-transport
 * https://github.com/spmjs/grunt-cmd-transport
 *
 * Copyright (c) 2013 Hsiaoming Yang
 * Licensed under the MIT license.
 */


module.exports = function(grunt) {

  var style = require('./').style.init(grunt);

  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/**/*.js',
        '<%= nodeunit.tests %>',
      ],
      options: {
        jshintrc: '.jshintrc',
      },
    },

    clean: {
      tests: ['tmp'],
    },

    transport: {
      options: {
        process: {
          data: {pkg: {version: '1.0.0'}}
        }
      },
      // test for chain
      chain: {
        options: {
          // this is the default format
          format: '{{family}}/{{name}}/{{version}}/{{filename}}',
          pkg: {
            family: 'cmd',
            name: 'chain',
            version: '1.0.0'
          }
        },
        files: [{
          cwd: 'test/fixtures/chain',
          src: '*.js',
          dest: 'tmp/chain'
        }]
      },
      css: {
        options: {
          parsers: {
            '.css': [style.cssParser, style.css2jsParser],
          },
          pkg: {
            family: 'cmd',
            name: 'css',
            version: '1.0.0',
            spm: {
              alias: {
                'button': 'alice/button/1.0.0/button'
              }
            }
          }
        },
        files: [{
          cwd: 'test/fixtures/css',
          src: '*.css',
          dest: 'tmp/css'
        }]
      },
      handlebars: {
        options: {
          pkg: {
            family: 'cmd',
            name: 'css',
            version: '1.0.0',
            spm: {
              alias: {
                'handlebars': 'gallery/1.0.0/handlebars'
              }
            }
          }
        },
        files: [{
          cwd: 'test/fixtures/template',
          src: '*.handlebars',
          dest: 'tmp/template'
        }]
      },
      html: {
        options: {
          pkg: {
            family: 'cmd',
            name: 'html',
            version: '1.0.0',
          }
        },
        files: [{
          cwd: 'test/fixtures/text',
          src: '*.html',
          dest: 'tmp/text'
        }]
      }
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*.test.js'],
    },

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'transport', 'nodeunit']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};

/*
 * grunt-cmd-transport
 * https://github.com/spmjs/grunt-cmd-transport
 *
 * Copyright (c) 2013 Hsiaoming Yang
 * Licensed under the MIT license.
 */


module.exports = function(grunt) {

  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
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
          pkg: {
            family: 'cmd',
            name: 'css',
            version: '1.0.0'
          }
        },
        files: [{
          cwd: 'test/fixtures/css',
          src: '*.css',
          dest: 'tmp/css'
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

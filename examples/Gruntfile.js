/*
 * grunt-cmd-transport
 * https://github.com/spmjs/grunt-cmd-transport
 *
 * Copyright (c) 2013 Hsiaoming Yang
 * Licensed under the MIT license.
 */


// https://github.com/spmjs/grunt-cmd-transport/issues/12

module.exports = function(grunt) {

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
      }
    }
  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('../tasks');
  // for real project:
  // grunt.loadNpmTasks('grunt-cmd-transport')

  grunt.registerTask('default', ['transport']);
};

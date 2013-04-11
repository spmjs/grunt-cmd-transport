/*
 * grunt-cmd-transport
 * https://github.com/spmjs/grunt-cmd-transport
 *
 * Copyright (c) 2013 Hsiaoming Yang
 * Licensed under the MIT license.
 */


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
      }
    }
  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('../tasks');
  // for real project:
  // grunt.loadNpmTasks('grunt-cmd-transport')

  grunt.registerTask('default', ['transport']);
};

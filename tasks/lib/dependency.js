var path = require('path');
var ast = require('cmd-util').ast;
var iduri = require('cmd-util').iduri;

exports.init = function(grunt) {
  var exports = {};

  function moduleDependencies(id, options) {
    if (!iduri.isAlias(options.pkg, id)) {
      grunt.log.warn('alias not defined.');
      return [];
    }
    var alias = iduri.parseAlias(options.pkg, id);
    // usually this is "$"
    if (alias === id) return [];

    var file = iduri.appendext(alias);

    var fpath;
    options.paths.some(function(base) {
      var filepath = path.join(base, file);
      if (grunt.file.exists(filepath)) {
        grunt.log.verbose.writeln('find module "' + filepath + '"');
        fpath = filepath;
        return true;
      }
    });
    if (!fpath) {
      grunt.log.warn("can't find module " + alias);
      return [];
    }
    var data = grunt.file.read(fpath);
    var parsed = ast.parse(data);
    var deps = [];

    var ids = parsed.map(function(meta) {
      return meta.id;
    });

    parsed.forEach(function(meta) {
      meta.dependencies.forEach(function(dep) {
        dep = iduri.absolute(alias, dep);
        if (!grunt.util._.contains(deps, dep) && !grunt.util._.contains(ids, dep)) {
          deps.push(dep);
        }
      });
    });
    return deps;
  }

  function relativeDependencies(fpath, options, basefile) {
    if (basefile) {
      fpath = path.join(path.dirname(basefile), fpath);
    }
    fpath = iduri.appendext(fpath);

    var deps = [];
    var moduleDeps = {};

    var data = grunt.file.read(fpath);
    var parsed = ast.parseFirst(data);
    parsed.dependencies.forEach(function(id) {
      if (id.charAt(0) === '.') {
        deps.push(id);
        if (/\.js$/.test(iduri.appendext(id))) {
          deps = grunt.util._.union(deps, relativeDependencies(id, options, fpath));
        }
      } else if (!moduleDeps[id]) {
        deps.push(iduri.parseAlias(options.pkg, id));

        var mdeps = moduleDependencies(id, options);
        moduleDeps[id] = mdeps;
        deps = grunt.util._.union(deps, mdeps);
      }
    });
    return deps;
  }

  exports.get = function(fpath, options) {
    return relativeDependencies(fpath, options);
  };

  return exports;
};

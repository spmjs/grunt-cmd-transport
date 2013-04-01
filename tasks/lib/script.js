exports.init = function(grunt) {
  var path = require('path');
  var ast = require('cmd-util').ast;
  var iduri = require('cmd-util').iduri;


  var exports = {};

  exports.jsParser = function(fileObj, options) {
    grunt.log.writeln('Transport ' + fileObj.src + ' -> ' + fileObj.dest);
    var data = fileObj.srcData || grunt.file.read(fileObj.src);
    var astCache = ast.getAst(data);

    if (ast.parseFirst(astCache).id) {
      grunt.log.warn('found id in "' + fileObj.src + '"');
      grunt.file.write(fileObj.dest, data);
      return;
    }
    var deps = relativeDependencies(fileObj.src, options);

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
      var ext = path.extname(v);
      if (ext) {
        return v.replace(new RegExp('\\' + ext + '$'), '-debug' + ext);
      } else {
        return v + '-debug';
      }
    });
    data = astCache.print_to_string(options.uglify);
    grunt.file.write(dest, data);
  };


  // helpers
  // ----------------
  function moduleDependencies(id, options) {
    if (!iduri.isAlias(options.pkg, id)) {
      grunt.log.warn('alias ' + id + ' not defined.');
      return [];
    }
    var alias = iduri.parseAlias(options.pkg, id);
    // usually this is "$"
    if (alias === id) return [];

    var file = iduri.appendext(alias);
    if (!/\.js$/.test(file)) return [];

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
        var alias = iduri.parseAlias(options.pkg, id);
        deps.push(alias);

        // don't parse no javascript dependencies
        var ext = path.extname(alias);
        if (ext && ext !== '.js') return;

        var mdeps = moduleDependencies(id, options);
        moduleDeps[id] = mdeps;
        deps = grunt.util._.union(deps, mdeps);
      }
    });
    return deps;
  }

  return exports;
};

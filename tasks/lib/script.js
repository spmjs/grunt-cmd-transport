exports.init = function(grunt) {

  var path = require('path');
  var extname = path.extname;
  var ast = require('cmd-util').ast;
  var iduri = require('cmd-util').iduri;
  var relative = require('relative');
  var md5 = require('./util').md5;
  var _ = grunt.util._;

  return {
    jsParser: jsParser
  };

  function jsParser(fileObj, options) {
    grunt.log.verbose.writeln('Transport ' + fileObj.src + ' -> ' + fileObj.dest);


    // cache every filepath content to generate hash
    //
    // {
    //   '/path/to/file': {
    //     id: undefined,
    //     dependencies: [],
    //     depMap: {},
    //     depsSpecified: false,
    //     contents: contents,
    //     path: path,
    //     hash: md5(contents, [])
    //   }
    // }
    var fileCache = {};

    var file = getFileInfo(path.join(process.cwd(), fileObj.src));

    if (!file) return;

    var data, filepath;
    if (!options.hash) {

      // create original file, xxx.js
      data = ast.modify(file.contents, {
        id: unixy(options.idleading) + getId(file),
        dependencies: getDeps(file),
        require: function(v) {
          // ignore when deps is specified by developer
          return file.depsSpecified ? v : iduri.parseAlias(options, v);
        }
      }).print_to_string(options.uglify);
      filepath = fileObj.dest;
      writeFile(data, filepath);
    } else {

      // create file with hash, xxx-2cio56s.js
      var hash = file.hash;
      data = ast.modify(file.contents, {
        id: unixy(options.idleading) + getId(file) + '-' + hash,
        dependencies: getDeps(file, addHash),
        require: function(v) {
          // ignore when deps is specified by developer
          if (file.depsSpecified) return v;
          var depFile = file.depMap[v];
          if (depFile) {
            return addHash(depFile);
          }
          return iduri.parseAlias(options, v);
        }
      }).print_to_string(options.uglify);
      filepath = fileObj.dest.replace(/\.js$/, '-' + hash + '.js');
      writeFile(data, filepath);
    }

    // create file with debug, xxx-debug.js
    if (options.debug) {
      data = ast.modify(data, addDebug).print_to_string(options.uglify);
      writeFile(data, addDebug(filepath));
    }

    function getId(file) {
      return file.id || unixy(fileObj.name.replace(/\.js$/, ''));
    }

    function getDeps(file, fn) {
      return file.dependencies.map(function(dep) {
        if (typeof dep !== 'string') {
          dep = fn ? fn(dep) : dep.id;
        }
        return dep.replace(/\.js$/, '');
      });
    }

    function addDebug(v) {
      var ext = extname(v);
      if (ext && options.parsers[ext]) {
        return v.replace(new RegExp('\\' + ext + '$'), '-debug' + ext);
      } else {
        return v + '-debug';
      }
    }

    function addHash(v) {
      if (v.id.charAt(0) !== '.') return v.id;
      if (!v.hash) return v.id;

      var ext = extname(v.id);
      if (ext && options.parsers[ext]) {
        return v.id.replace(new RegExp('\\' + ext + '$'), '-' + v.hash + ext);
      } else {
        return v.id + '-' + v.hash;
      }
    }

    function writeFile(data, dest) {
      grunt.log.writeln('transport ' + dest + ' created');
      grunt.file.write(dest, addOuterBoxClass(data + '\n', options));
    }

    // helpers
    // ----------------
    function unixy(uri) {
      return uri.replace(/\\/g, '/');
    }

    function getStyleId() {
      return unixy((options || {}).idleading || '')
        .replace(/\/$/, '')
        .replace(/\//g, '-')
        .replace(/\./g, '_');
    }

    function addOuterBoxClass(data) {
      // ex. arale/widget/1.0.0/ => arale-widget-1_0_0
      var styleId = getStyleId(options);
      if (options.styleBox && styleId) {
        data = data.replace(/(\}\)[;\n\r ]*$)/, 'module.exports.outerBoxClass="' + styleId + '";$1');
      }
      return data;
    }

    function parseFileDependencies(filepath, depMap) {
      if (!grunt.file.exists(filepath)) {
        if (!/\{\w+\}/.test(filepath)) {
          grunt.log.warn('can\'t find ' + filepath);
        }
        return [];
      }

      if (extname(filepath) !== '.js') {
        return [];
      }

      var parsed, data = grunt.file.read(filepath);
      try {
        parsed = ast.parseFirst(data);
      } catch(e) {
        grunt.log.error(e.message + ' [ line:' + e.line + ', col:' + e.col + ', pos:' + e.pos + ' ]');
        return [];
      }

      return parsed.dependencies.map(function(id) {
        if (id.charAt(0) === '.') {
          var origId = id;
          id = iduri.appendext(id);
          var depFilepath = path.join(path.dirname(filepath), id);
          var depFile = getFileInfo(depFilepath);
          if (!depFile) return;
          var obj = {
            id: origId,
            path: depFile.path,
            contents: depFile.contents,
            hash: depFile.hash,
            relative: true
          };
          if (depMap) depMap[origId] = obj;
          return [obj].concat(parseFileDependencies(depFilepath));
        } else {
          return parseModuleDependencies(id);
        }
      });
    }

    function parseModuleDependencies(id) {
      var alias = iduri.parseAlias(options, id);

      if (iduri.isAlias(options, id) && alias === id) {
        // usually this is "$"
        return [{id: id}];
      }

      // don't resolve text!path/to/some.xx, same as seajs-text
      if (/^text!/.test(id)) {
        return [{id: id}];
      }

      var fpath = iduri.appendext(alias);

      var fbase;
      options.paths.some(function(base) {
        var filepath = path.join(base, fpath);
        if (grunt.file.exists(filepath)) {
          grunt.log.verbose.writeln('find module "' + filepath + '"');
          fbase = base;
          fpath = filepath;
          return true;
        }
      });

      if (!fpath) {
        grunt.fail.warn('can\'t find module ' + alias);
        return [{id: id}];
      }

      var file = getFileInfo(fpath);

      if (!file) {
        return [{id: id}];
      }

      // don't parse no javascript dependencies
      if (!/\.js$/.test(fpath)) {
        return [{
          id: alias,
          path: file.path,
          hash: file.hash,
          contents: file.contents
        }];
      }

      var parsed = ast.parse(file.contents);
      var ids = parsed.map(function(meta) {
        return meta.id;
      });
      var deps = parsed.map(function(meta) {
        return meta.dependencies.map(function(id) {
          id = iduri.absolute(alias, id);
          // won't return if deps were loaded(defined in file)
          if (!_.contains(ids, id) && !_.contains(ids, id.replace(/\.js$/, ''))) {
            id = iduri.appendext(id);
            var file = getFileInfo(path.join(fbase, id));
            if (!file) return;
            return {
              id: id,
              path: file.path,
              hash: file.hash,
              contents: file.contents
            };
          }
        });
      });
      return [{
        id: alias,
        path: file.path,
        hash: file.hash,
        contents: file.contents
      }].concat(deps);
    }

    function getFileInfo(path){
      if (fileCache[path]) {
        return fileCache[path];
      }

      if (!grunt.file.exists(path)) return;
      var astCache, deps, contents = grunt.file.read(path);

      if (extname(path) !== '.js') {
        return fileCache[path] = {
          id: undefined,
          dependencies: [],
          depMap: {},
          depsSpecified: false,
          contents: contents,
          path: path,
          hash: md5(contents, [])
        };
      }

      try {
        astCache = ast.getAst(contents);
      } catch(e) {
        grunt.log.error('js parse error ' + path.red);
        grunt.fail.fatal(e.message + ' [ line:' + e.line + ', col:' + e.col + ', pos:' + e.pos + ' ]');
      }

      // get id/deps of origin cmd module
      var meta = ast.parseFirst(astCache), depMap = {};

      if (!meta) {
        grunt.log.warn('found non cmd module "' + path + '"');
        // do nothing
        return;
      }

      if (meta.id) {
        grunt.log.verbose.writeln('id exists in "' + path + '"');
      }

      if (meta.dependencyNode) {
        deps = meta.dependencies;
        grunt.log.verbose.writeln('dependencies exists in "' + path + '"');
      } else {
        deps = parseFileDependencies(path, depMap);
        deps = grunt.util._.chain(deps)
          .flatten()
          .filter(function(item) {return typeof item !== 'undefined'})
          .uniq(function(item) {return item.path})
          .each(function(item) {
            if (item.relative) item.id = relative(path, item.path);
          })
          .value();
        grunt.log.verbose.writeln(deps.length ?
          'found dependencies ' + deps : 'found no dependencies');
      }

      return fileCache[path] = {
        id: meta.id,
        dependencies: deps,
        depMap: depMap,
        depsSpecified: typeof meta.dependencyNode !== 'undefined',
        contents: contents,
        path: path,
        hash: typeof meta.dependencyNode !== 'undefined' ? '' : md5(contents, deps)
      };
    }
  }
};

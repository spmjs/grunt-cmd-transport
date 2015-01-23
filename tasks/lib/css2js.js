var format = require('util').format;
var css2str = require('css2str');
var cleancss = require('clean-css');
var commonParser = require('./common');

exports.init = function(grunt) {
  return commonParser.init(grunt, {
    type: 'css',
    factoryParser: css2js
  });
};
exports.css2js = function(code, id, options, fileObj) {
  var tpl = 'define("%s", [], %s);';
  return format(tpl, id, css2js(code, options, fileObj));
};

function css2js(code, options, fileObj) {
  var addStyleBox = false;
  if (options.styleBox === true) {
    addStyleBox = true;
  } else if (options.styleBox && options.styleBox.length) {
    options.styleBox.forEach(function(file) {
      if (file === fileObj.name) {
        addStyleBox = true;
      }
    });
  }

  // if outside css modules, fileObj would be undefined
  // then dont add styleBox
  var opt = {};
  if (addStyleBox && fileObj) {
    // ex. arale/widget/1.0.0/ => arale-widget-1_0_0
    var styleId = unixy((options || {}).idleading || '')
      .replace(/\/$/, '')
      .replace(/\//g, '-')
      .replace(/\./g, '_');
    opt.prefix = ['.', styleId, ' '].join('');
  }

  code = css2str(code, opt);

  // remove comment and format
  code = cleancss.process(code, {
    keepSpecialComments: 0,
    removeEmpty: true
  });

  // transform css to js
  // spmjs/spm#581
  var template = 'function() {seajs.importStyle(\'%s\')}';
  return format(template, code);
}

function unixy(uri) {
  return uri.replace(/\\/g, '/');
}

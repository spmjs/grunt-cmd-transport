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

function css2js(code, options) {
  // if outside css modules, fileObj would be undefined
  // then dont add styleBox
  var opt = {};
  if (options.styleBox === true) {
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
  var template = 'function() {seajs.importStyle("%s")}';
  return format(template, code);
}

function unixy(uri) {
  return uri.replace(/\\/g, '/');
}

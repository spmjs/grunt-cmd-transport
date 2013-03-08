// transform css to js
// spmjs/spm#581

var format = require('util').format;
var cleancss = require('clean-css');

module.exports = function(code, id) {

  var tpl = [
    'define("%s", [], function() {',
    'function importStyle(cssText) {',
    'var element = document.createElement("style");',
    'doc.getElementsByTagName("head")[0].appendChild(element);',
    'if (element.styleSheet) {',
    'element.styleSheet.cssText = cssText;',
    '} else {',
    'element.appendChild(doc.createTextNode(cssText));',
    '}',
    '}',
    "importStyle('%s')",
    '});'
  ].join('\n');

  code = cleancss.process(code, {
    keepSpecialComments: 0,
    removeEmpty: true
  });
  code = format(tpl, id, code.replace(/\'/g, '\\\''));

  return code;
};

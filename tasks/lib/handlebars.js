var commonParser = require('./common');

exports.init = function(grunt) {
  var format = require('util').format;
  var handlebars = require('handlebars');

  return commonParser.init(grunt, {
    type: 'handlebars',
    depParser: function(data, options) {
      // handlebars alias
      return '"' + options.handlebars.id + '"';
    },
    factoryParser: function(data, options) {
      patchHandlebars(handlebars);
      var code = handlebars.precompile(data, options.handlebars);
      var template = [
        'function(require, exports, module) {',
          'var Handlebars = require("%s");',
          'var template = Handlebars.template;',
          'module.exports = template(%s);',
        '}'
      ].join('\n');
      return format(template, options.handlebars.id, code);
    }
  });
};

// patch for handlebars
function patchHandlebars(Handlebars) {
  Handlebars.JavaScriptCompiler.prototype.preamble = function() {
    var out = [];

    if (!this.isChild) {
      var namespace = this.namespace;
      // patch for handlebars
      var copies = [
        "helpers = helpers || {};",
        "for (var key in " + namespace + ".helpers) {",
        "   helpers[key] = helpers[key] || " + namespace + ".helpers[key];",
        "}"
      ].join('\n');
      if (this.environment.usePartial) { copies = copies + " partials = partials || " + namespace + ".partials;"; }
      if (this.options.data) { copies = copies + " data = data || {};"; }
      out.push(copies);
    } else {
      out.push('');
    }

    if (!this.environment.isSimple) {
      out.push(", buffer = " + this.initializeBuffer());
    } else {
      out.push("");
    }

    // track the last context pushed into place to allow skipping the
    // getContext opcode when it would be a noop
    this.lastContext = 0;
    this.source = out;
  };
}

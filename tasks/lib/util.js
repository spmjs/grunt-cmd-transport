var crypto = require('crypto');

exports.md5 = function md5(contents, deps) {
  if (!deps) deps = [];
  contents = deps.map(function(depFile) {
    return depFile.contents || '';
  }).join('') + contents;
  return crypto
  .createHash('md5')
  .update(contents, 'utf8')
  .digest('hex')
  .slice(0, 8);
};

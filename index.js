var path = require('path');
var EngineTest = require('./lib/engine-test');

module.exports = function checkEngines(json, callback) {
  if (!callback) {
    callback = json;
    json = require(path.resolve(process.cwd(), 'package.json'));
  }

  var versions = json.engines;
  var types = Object.keys(versions || {});
  var errors = [];
  var count = types.length;
  var info = {};
  var type;

  function done(err, constraints) {
    info[constraints[0]] = [constraints[1], constraints[2]]

    if (err) {
      errors.push(err);
    }

    if (--count) {
      return;
    }

    if (errors.length > 0) {
      return callback(new Error(errors.join('\n')), info);
    }

    callback(null, info);
  }

  for (var i = 0, len = types.length; i < len; i++) {
    type = types[i];
    test = new EngineTest(type);
    test.check(versions[type], done);
  }
};

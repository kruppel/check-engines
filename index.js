var path = require('path');
var childProcess = require('child_process');
var format = require('util').format;
var semver = require('semver');

function checkVersions(json, callback) {
  if (!callback) {
    callback = json;
    json = path.resolve(process.cwd(), 'package.json');
  }

  var versions = json.engines;
  var types = Object.keys(versions || {});
  var errors = [];
  var count = types.length;
  var type;
  var range;
  var cmd;

  function done() {
    if (--count) {
      return;
    }

    if (errors.length > 0) {
      return callback(new Error(errors.join('\n')));
    }

    callback();
  }

  for (var i = 0, len = types.length; i < len; i++) {
    type = types[i];
    range = versions[type];
    cmd = childProcess.spawn(type, ['-v']);

    cmd.stdout.on('data', function(data) {
      var version = data.toString().trim();

      if (!semver.satisfies(version, versions[type])) {
        errors.push(
          format(
            '[ERROR] %s version (%s) does not satisfy specified range (%s)',
            type,
            version,
            range
          )
        );
      }

      done();
    });
  }
};

module.exports = checkVersions;

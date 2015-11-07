var path = require('path');
var childProcess = require('child_process');
var format = require('util').format;
var semver = require('semver');

function queryProcess(type, callback) {
  callback(process.version.substring(1));
}

function spawnProcess(type, callback) {
  var cmd = childProcess.spawn(type, ['-v']);

  cmd.stdout.on('data', function(data) {
    var version = data.toString().trim();

    callback(version);
  });
}

function checkEngines(json, callback) {
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
  var range;
  var cmd;

  function done(name, actual, expected) {
    info[name] = [actual, expected];

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
    range = versions[type];
    cmd = (type === 'node' || type === 'iojs') ? queryProcess : spawnProcess;

    cmd(type, function(version) {
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

      done(type, version, range);
    });
  }
};

module.exports = checkEngines;

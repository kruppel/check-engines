var crossSpawn = require('cross-spawn');
var format = require('util').format;
var semver = require('semver');

function EngineTest(type) {
  this.type = type;
  this.isNode = type === 'node' || type === 'iojs';
}

EngineTest.prototype.check = function(range, callback) {
  var type = this.type;

  this.getVersion(function(err, version) {
    var msg;

    if (err) {
      msg = format(
        'Unable to determine version for (%s). Error was (%s)',
        type,
        err.message
      );
      return callback(new Error(msg));
    }

    if (!semver.satisfies(version, range)) {
      msg = format(
        '%s version (%s) does not satisfy specified range (%s)',
        type,
        version,
        range
      );

      return callback(new Error(msg), [type, version, range]);
    }

    callback(null, [type, version, range]);
  });
};

EngineTest.prototype.getVersion = function(callback) {
  if (this.isNode) {
    process.nextTick(function() {
      callback(null, process.version.substring(1));
    });

    return;
  }

  var result = '';
  var version = crossSpawn.spawn(this.type, ['--version'], {shell: true});

  version.stdout.on('data', function(data) {
    result += data.toString();
  });

  version.on('close', function() {
    callback(null, result.trim());
  });

  version.on('error', callback);
};

module.exports = EngineTest;

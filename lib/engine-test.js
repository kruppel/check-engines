var childProcess = require('child_process');
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

  childProcess.spawn(this.type, ['-v']).stdout.on('data', function(data) {
    callback(null, data.toString().trim());
  });
};

module.exports = EngineTest;

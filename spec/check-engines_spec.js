describe("check-engines", function() {
  var childProcess = require('child_process');
  var EventEmitter = require('events').EventEmitter;
  var sinon = require('sinon');
  var checkEngines = require('./../');
  var packageJSON = require('./package.json');
  var mockChildProcess;
  var cwd;

  before(function() {
    cwd = process.cwd();
    process.chdir(__dirname);
  });

  after(function() {
    process.chdir(cwd);
  });

  beforeEach(function() {
    mockChildProcess = {
      stdout: new EventEmitter()
    };
    sinon.stub(childProcess, 'spawn');
    childProcess.spawn.withArgs('npm', ['-v']).returns(mockChildProcess);
  });

  afterEach(function() {
    mockChildProcess.stdout.removeAllListeners();
    childProcess.spawn.restore();
  });

  describe("without json argument", function() {
    var spy;

    beforeEach(function() {
      spy = sinon.spy();
      checkEngines(spy);
      mockChildProcess.stdout.emit('data', '2.11.2\n');
    });

    it("reads package.json from cwd", function() {
      expect(spy).to.have.been.calledWith(
        null,
        {
        npm: ['2.11.2', '>=2.11.2']
        }
      );
    });
  });

  describe("node", function () {
    var version = process.version.substring(1);

    describe("engine version", function () {
      describe("less than package.json version", function () {
        it("calls back with an error", function (done) {
          var pkgJSON = {
            "engines": {
              "node": ">" + version
            }
          };

          checkEngines(pkgJSON, function(err) {
            expect(err.message).to.equal(
              '[ERROR] node version (' + version + ') does not satisfy specified range (>' + version + ')'
            );
            done();
          });
        });
      });

      describe("greater than or equal to package.json version", function() {
        it("does not call back with an error", function(done) {
          var pkgJSON = {
            "engines": {
              "node": "<=" + version
            }
          };

          checkEngines(pkgJSON, function(err) {
            expect(err).to.be.null;
            done();
          });
        });
      });
    });
  });

  describe("npm", function() {
    describe("engine version", function() {
      var spy;

      beforeEach(function() {
        spy = sinon.spy();
        checkEngines(packageJSON, spy);
      });

      describe("less than package.json version", function() {
        beforeEach(function() {
          mockChildProcess.stdout.emit('data', '1.4.28\n');
        });

        it("calls back with an error", function() {
          expect(spy).to.have.been.calledWith(sinon.match.instanceOf(Error));
          expect(spy.args[0][0].message).to.equal(
            '[ERROR] npm version (1.4.28) does not satisfy specified range (>=2.11.2)'
          );
        });
      });

      describe("greater than package.json version", function() {
        beforeEach(function() {
          mockChildProcess.stdout.emit('data', '2.11.2\n');
        });

        it("does not call back with an error", function() {
          expect(spy).to.have.been.calledWith();
        });
      });
    });
  });

  describe("two engines in package.json", function() {
    var spy;
    var mockNodeChildProcess;

    beforeEach(function() {
      mockNodeChildProcess = {
        stdout: new EventEmitter()
      };
      childProcess.spawn.withArgs('node', ['-v']).returns(mockNodeChildProcess);

      spy = sinon.spy();
      checkEngines(require('./package-double.json'), spy);
      mockChildProcess.stdout.emit('data', '2.11.2\n');
      mockNodeChildProcess.stdout.emit('data', '4.0.0\n');
    });

    it("reads package.json from cwd", function() {
      expect(spy).to.have.been.calledWith(
        null,
        {
        npm: ['2.11.2', '>=2.11.2'],
        node: ['4.0.0', '>=4.0.0']
        }
      );
    });
  });

});

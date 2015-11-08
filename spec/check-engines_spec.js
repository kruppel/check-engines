describe("check-engines", function() {
  var childProcess = require('child_process');
  var EventEmitter = require('events').EventEmitter;
  var sinon = require('sinon');
  var checkEngines = require('./../');
  var packageJSON = require('./package.json');
  var mockChildProcess;
  var cwd;

  var VERSION = process.version.substring(1);

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
    describe("engine version", function () {
      describe("less than package.json version", function () {
        it("calls back with an error", function (done) {
          var pkgJSON = {
            "engines": {
              "node": ">" + VERSION
            }
          };

          checkEngines(pkgJSON, function(err) {
            expect(err.message).to.equal(
              'Error: node version (' + VERSION + ') does not satisfy specified range (>' + VERSION + ')'
            );
            done();
          });
        });
      });

      describe("greater than or equal to package.json version", function() {
        it("does not call back with an error", function(done) {
          var pkgJSON = {
            "engines": {
              "node": "<=" + VERSION
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
            'Error: npm version (1.4.28) does not satisfy specified range (>=2.11.2)'
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
    var desc;
    var spy;

    beforeEach(function(done) {
      desc = Object.getOwnPropertyDescriptor(process, 'version');
      Object.defineProperty(process, 'version', {
        value: 'v4.0.0'
      });

      spy = sinon.spy();

      checkEngines(require('./package-double.json'), function() {
        spy.apply(null, arguments);
        done();
      });
      mockChildProcess.stdout.emit('data', '2.11.2\n');
    });

    afterEach(function() {
      Object.defineProperty(process, 'version', desc);
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

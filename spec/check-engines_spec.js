var crossSpawn = require('cross-spawn');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var sinon = require('sinon');
var checkEngines = require('./../');

var VERSION = process.version.substring(1);

describe('check-engines', function() {
  var mockChildProcess;
  var cwd;

  function MockChildProcess() {
    this.stdout = new EventEmitter();
  }

  util.inherits(MockChildProcess, EventEmitter);

  before(function() {
    cwd = process.cwd();
    process.chdir(__dirname);
  });

  after(function() {
    process.chdir(cwd);
  });

  beforeEach(function() {
    mockChildProcess = new MockChildProcess();
    sinon.stub(crossSpawn, 'spawn');
    crossSpawn.spawn.withArgs('npm', ['--version'], {shell: true})
      .returns(mockChildProcess);
  });

  afterEach(function() {
    mockChildProcess.stdout.removeAllListeners();
    crossSpawn.spawn.restore();
  });

  describe('without json argument', function() {
    var cwd;
    var spy;

    beforeEach(function(done) {
      spy = sinon.spy();
      cwd = process.cwd();
      process.chdir('fixtures');
      checkEngines(function() {
        spy.apply(this, arguments);
        done();
      });
      mockChildProcess.stdout.emit('data', '2.11.2\n');
      mockChildProcess.emit('close');
    });

    afterEach(function() {
      process.chdir(cwd);
    });

    it('reads package.json from cwd', function() {
      expect(spy).to.have.been.calledWith(null, {
        npm: ['2.11.2', '>=2.11.2']
      });
    });
  });

  describe('node', function() {
    describe('engine version', function() {
      var json;

      describe('less than package.json version', function() {
        beforeEach(function() {
          json = {
            'engines': {
              'node': '>' + VERSION
            }
          };
        });

        it('calls back with an error', function(done) {
          checkEngines(json, function(err) {
            expect(err.message).to.equal(
              'Error: node version (' +
              VERSION + ') does not satisfy specified range (>' +
              VERSION + ')'
            );

            done();
          });
        });
      });

      describe('greater than or equal to package.json version', function() {
        beforeEach(function() {
          json = {
            'engines': {
              'node': '<=' + VERSION
            }
          };
        });

        it('does not call back with an error', function(done) {
          checkEngines(json, function(err) {
            expect(err).to.be.null;

            done();
          });
        });
      });
    });
  });

  describe('npm', function() {
    describe('engine version', function() {
      var json = require('./fixtures/package.json');
      var spy;

      beforeEach(function() {
        spy = sinon.spy();
      });

      describe('less than package.json version', function() {
        beforeEach(function(done) {
          checkEngines(json, function() {
            spy.apply(this, arguments);
            done();
          });
          mockChildProcess.stdout.emit('data', '1.4.28\n');
          mockChildProcess.emit('close');
        });

        it('calls back with an error', function() {
          expect(spy).to.have.been.calledWith(sinon.match.instanceOf(Error));
          expect(spy.args[0][0].message).to.equal(
            'Error: npm version (1.4.28) does not satisfy specified range ' +
            '(>=2.11.2)'
          );
        });
      });

      describe('greater than package.json version', function() {
        beforeEach(function(done) {
          checkEngines(json, function() {
            spy.apply(this, arguments);
            done();
          });
          mockChildProcess.stdout.emit('data', '2.11.2\n');
          mockChildProcess.emit('close');
        });

        it('does not call back with an error', function() {
          expect(spy).to.have.been.calledWith();
        });
      });
    });
  });

  describe('multiple engines', function() {
    var json = require('./fixtures/multiple-engines.json');
    var descriptor;
    var spy;

    beforeEach(function(done) {
      descriptor = Object.getOwnPropertyDescriptor(process, 'version');
      Object.defineProperty(process, 'version', {
        value: 'v4.0.0'
      });

      spy = sinon.spy();

      checkEngines(json, function() {
        spy.apply(null, arguments);
        done();
      });
      mockChildProcess.stdout.emit('data', '2.11.2\n');
      mockChildProcess.emit('close');
    });

    afterEach(function() {
      Object.defineProperty(process, 'version', descriptor);
    });

    it('reads package.json from cwd', function() {
      expect(spy).to.have.been.calledWith(null, {
        npm: ['2.11.2', '>=2.11.2'],
        node: ['4.0.0', '>=4.0.0']
      });
    });
  });

  describe('invalid engines', function() {
    var json = require('./fixtures/invalid-engines.json');

    beforeEach(function() {
      var invalidCommandMock = new MockChildProcess();

      crossSpawn.spawn.withArgs(
        'this-is-not-an-executable', ['--version']
      ).returns(invalidCommandMock);

      process.nextTick(function() {
        invalidCommandMock.emit(
          'error',
          new Error('unable to execute command')
        );
        mockChildProcess.stdout.emit('data', '2.11.2\n');
        mockChildProcess.emit('close');
      });
    });

    it('handles invalid engines', function(done) {
      checkEngines(json, function(error) {
        expect(error.message).to.contain(
          'Unable to determine version for (this-is-not-an-executable)'
        );

        done();
      });
    });

    it('handles invalid ranges', function(done) {
      checkEngines(json, function(error) {
        expect(error.message).to.contain(
          'does not satisfy specified range (not a valid range)'
        );

        done();
      });
    });
  });

  describe('yarn engine support', function() {
    var json = require('./fixtures/yarn-engine.json');
    var spy;

    beforeEach(function(done) {
      var yarnCommandMock = new MockChildProcess();

      crossSpawn.spawn.withArgs(
        'yarn', ['--version']
      ).returns(yarnCommandMock);

      spy = sinon.spy();

      checkEngines(json, function() {
        spy.apply(null, arguments);
        done();
      });

      yarnCommandMock.stdout.emit('data', '2.11.2\n');
      yarnCommandMock.emit('close');
    });

    it('handles yarn engine', function() {
      expect(spy).to.have.been.calledWith(null, {
        yarn: ['2.11.2', '>=2.10']
      });
    });
  });
});

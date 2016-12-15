var childProcess = require('child_process');
var EventEmitter = require('events').EventEmitter;
var sinon = require('sinon');
var checkEngines = require('./../');

var VERSION = process.version.substring(1);

describe('check-engines', function() {
  var mockChildProcess;
  var cwd;

  function createMockChildProcess() {
    var process = new EventEmitter();
    process.stdout = new EventEmitter();
    return process;
  }

  before(function() {
    cwd = process.cwd();
    process.chdir(__dirname);
  });

  after(function() {
    process.chdir(cwd);
  });

  beforeEach(function() {
    mockChildProcess = createMockChildProcess();
    sinon.stub(childProcess, 'spawn');
    childProcess.spawn.withArgs('npm', ['-v']).returns(mockChildProcess);
  });

  afterEach(function() {
    mockChildProcess.stdout.removeAllListeners();
    childProcess.spawn.restore();
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
    var badCommandMock;
    beforeEach(function() {
      badCommandMock = createMockChildProcess();
      childProcess.spawn.withArgs(
        'this-is-not-an-executable', ['-v']
      ).returns(badCommandMock);
    });

    it('handles invalid ranges and engines', function(done) {
      setTimeout(function() {
        badCommandMock.emit('error', new Error('unable to execute command'));
      }, 0);
      checkEngines(json, function(error) {
        expect(error).not.to.equal(null);
        expect(error.message).to.contain(
          'this-is-not-an-executable version (undefined)'
        );
        done();
      });
    });
  });
});

describe("npm", function() {
  var childProcess = require('child_process');
  var EventEmitter = require('events').EventEmitter;
  var sinon = require('sinon');
  var chai = require('chai');
  var expect = chai.expect;
  var checkEngines = require('./../');
  var packageJSON = require('./package.json');
  var mockChildProcess;

  chai.use(require('sinon-chai'));

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

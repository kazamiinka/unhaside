const expect = chai.expect;
mocha.setup('bdd');

describe('test a function', function() {
    var testPrompt;
    var testAlert;
    beforeEach(function() {
        testPrompt = sinon.stub(window, 'prompt');
        testAlert = sinon.stub(window, 'alert');
    });

    afterEach(function() {
        window.prompt.restore();
        window.alert.restore();
        testPrompt = null;
        testAlert = null;
    });

    it('ax', function(done) {
        testPrompt.onCall(0).returns('ax');
        ax();
        expect($('#res')).to.have.text('ax');
        done();
    });

    it('bx', function(done) {
        testPrompt.onCall(0).returns('bx');
        ax();
        expect($('#res')).to.have.text('bx');
        done();
    });
})



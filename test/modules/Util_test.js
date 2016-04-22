var should, u;
should = require('should');

u = require("../../modules/Util.js");

describe('Util', function() {
    describe('#uuid()', function () {
        it('should return a string', function() {
            u.Util.uuid().should.be.a.String();
        });
    });
});
var should, u;
should = require('should');

u = require("../../modules/Util.js");

describe('Util', function() {
    describe('#uuid()', function () {
        it('should return a string', function() {
            u.Util.uuid().should.be.a.String();
        });
    });

    describe('#err()', function () {
        it('should return a function', function() {
            var result =  u.Util.err();
            should(result).be.type('function');
        });
    });

    describe('#err()', function () {
        it('result called with parameter should throw an exception', function() {
            var result =  u.Util.err();
            (function() {
                result(new Error());
            }).should.throw();
        });
    });

    describe('#err()', function () {
        it('called with parameter should execute parameter', function() {
            var result, parameter, err = new Error(), f = function (p) {
                parameter = p;
            };
            result = u.Util.err(f);
            result(err);
            parameter.should.equal(err);
        });
    });
});
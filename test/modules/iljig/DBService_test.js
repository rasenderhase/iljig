var should, db, s;
should = require("should");

db = require("../../../modules/iljig/DBService.js");
s = require("../../../modules/iljig/SpielIljig.js");

describe("DBService", function() {
    var dbService = db.dbService;
    var spiel;
    beforeEach(function() {
        spiel = new s.SpielIljig(4711, "geheim");
    });

    describe("#saveSpiel", function() {
        it("should be a promise", function() {
            dbService.saveSpiel(spiel).should.be.a.Promise();
            dbService.db.spiel.should.have.ownProperty(4711);
            dbService.db.spiel[4711].should.be.eql(spiel.toDb());
            dbService.db.spiel[4711]["adminGeheimnis"].should.be.equal("geheim", "falsches adminGeheimnis");
        });
    });
});
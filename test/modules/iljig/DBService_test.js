var should, log4js, logger, db, s;

should = require("should");
log4js = require('log4js');
logger = log4js.getLogger("iljig.DbService_test");

db = require("../../../modules/iljig/DBService.js");
s = require("../../../modules/iljig/SpielIljig.js");

describe("DBService", function() {
    var dbService = db.dbService;
    var spiel;
    beforeEach(function() {
        spiel = new s.SpielIljig(4711, "geheim");
    });

    describe("#saveSpiel", function() {
        it("should save a spiel", function() {
            dbService.saveSpiel(spiel).should.be.a.Promise();
            dbService.db.spiel.should.have.ownProperty(4711);
            dbService.db.spiel[4711].should.be.eql(spiel.toDb());
            dbService.db.spiel[4711]["adminGeheimnis"].should.be.equal("geheim", "falsches adminGeheimnis");
        });
    });

    describe("#getSpiel", function() {
        it("should get the saved spiel with different 'lastAcces' date", function() {
            var getSpielPromise;
            dbService.saveSpiel(spiel);
            getSpielPromise = dbService.getSpiel(4711);

            getSpielPromise.done(function(res, err) {
                if (err) {
                    logger.debug(err);
                }
                else {
                    logger.debug(res.toDb());
                    logger.debug(spiel.toDb());
                }
            });

            // Property für Vergleich löschen, da unterschiedlich
            delete spiel.lastAccess;
            // bei Promises muss das Assertion-Objekt zurückgegeben werden
            // https://shouldjs.github.io/#assertion-finally
            return getSpielPromise.should.finally.have.properties(spiel);
        });
    });
});
var should, log4js, logger, k;
should = require("should");
log4js = require("log4js");
logger = log4js.getLogger("iljig.Kartenspiel_test");
k = require("../../modules/Kartenspiel.js");

describe("Karte", function() {
    var karte;
    beforeEach(function() {
        karte = new k.Karte("grün", "350€");
    });

    describe("#constructor", function() {
        it("should have two properties: farbe, wert", function() {
            karte.should.have.property("farbe", "grün");
            karte.should.have.property("wert", "350€");
        });
    });
    describe("#toString", function() {
        it("should return a string", function() {
            karte.toString().should.be.a.String()
                .and.be.equal("Karte[grün-350€]");
        });
    });
    describe("#toDb", function() {
        it("should return a data object copy", function() {
            var dbo = karte.toDb();
            dbo.should.not.be.exactly(karte);
            dbo.should.have.property("farbe", "grün");
            dbo.should.have.property("wert", "350€");
        });
    });
    describe("#stringify", function() {
        it("should return a string", function() {
            karte.stringify().should.be.a.String()
                .and.match(/{\s*"farbe"\s*:\s*"grün"\s*,\s*"wert"\s*:\s*"350€"\s*}/);
        });
    });
    describe("#stringify", function() {
        it("should return a JSON string", function() {
            JSON.parse(karte.stringify()).should.have.property("farbe", "grün");
        });
    });
});

describe("Kartenspiel", function() {
    var kartenspiel;
    beforeEach(function() {
        logger.debug("Kartenspiel-beforeEach: instanziere Kartenspiel");
        kartenspiel = new k.Kartenspiel();
    });

    describe("#constructor", function() {
        it("should have name Kartenspiel", function() {
            kartenspiel.should.have.property("name", "Kartenspiel");
            kartenspiel.should.have.property("kartenMap");
            kartenspiel.should.have.property("karten");
        });
    });

    describe("#addKarte", function() {
        it("should add the karte", function() {
            kartenspiel.addKarte("grün", "350€");
            kartenspiel.addKarte("blau", "199$");

            kartenspiel.getKarten()[0].should.have.property("farbe", "grün");
            kartenspiel.getKarten()[0].should.have.property("wert", "350€");

            kartenspiel.getKarten()[1].should.have.property("farbe", "blau");
            kartenspiel.getKarten()[1].should.have.property("wert", "199$");
        });
    });
});

describe("Spieler", function() {
    var spieler;
    beforeEach(function () {
        spieler = new k.Spieler(1, "Andi", 4711);
    });

    describe("#constructor", function() {
        it("should have name Kartenspiel", function() {
            spieler.should.have.property("id", 1);
            spieler.should.have.property("name", "Andi");
            spieler.should.have.property("spielId", 4711);
            spieler.should.have.property("nummer", null);
            spieler.should.have.property("hand", []);
        });
    });

    describe("#constructor with default id", function() {
        it("should have name Kartenspiel", function() {
            spieler = new k.Spieler(null, "Andi", 4711);

            spieler.id.should.not.be.null();
            spieler.should.have.property("name", "Andi");
            spieler.should.have.property("spielId", 4711);
            spieler.should.have.property("nummer", null);
            spieler.should.have.property("hand", []);
        });
    });
});
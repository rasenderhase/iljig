var should, k;
should = require("should");

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
            dbo.should.have.property("farbe", "grün")
            dbo.should.have.property("wert", "350€");
        });
    });
    describe("#stringify", function() {
        it("should return a string", function() {
            karte.stringify().should.be.a.String()
                .and.match(/{\s*"farbe"\s*:\s*"grün"\s*,\s*"wert"\s*:\s*"350€"\s*}/);
        });
    });
});

describe("Kartenspiel", function() {
    var kartenspiel;
    beforeEach(function() {
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

            kartenspiel.karten[0].should.have.property("farbe", "grün");
            kartenspiel.karten[0].should.have.property("wert", "350€");

            kartenspiel.karten[1].should.have.property("farbe", "blau");
            kartenspiel.karten[1].should.have.property("wert", "199$");
        });
    });
});
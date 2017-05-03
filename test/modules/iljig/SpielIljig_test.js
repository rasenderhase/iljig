var s, k, should;
should = require("should");

s = require("../../../modules/iljig/SpielIljig.js");
k = require("../../../modules/iljig/KartenspielIljig.js");

describe("SpielIljig", function() {
    var spielIljig;
    beforeEach(function () {
        spielIljig = new s.SpielIljig(1, "geheim");
    });


    describe("#addSpieler", function() {
        it("should add a spjeler", function() {
            var spieler = new k.Spieler(1000, "andi", 1);
            spielIljig.addSpieler(spieler);

            spielIljig.spieler.length.should.be.equal(1, "1 player should be added");
            spieler.should.have.property("nummer", 0);
        });

        it("should throw an exception because too many players added", function() {
            var spieler;
            spielIljig.addSpieler(new k.Spieler(1000, "andi", 1));
            spielIljig.addSpieler(new k.Spieler(1001, "andj", 1));
            spielIljig.addSpieler(new k.Spieler(1002, "andk", 1));
            spielIljig.addSpieler(new k.Spieler(1003, "andl", 1));
            spielIljig.addSpieler(new k.Spieler(1004, "andm", 1));
            spielIljig.addSpieler(new k.Spieler(1005, "andn", 1));
            spielIljig.addSpieler(new k.Spieler(1006, "ando", 1));
            spielIljig.addSpieler(new k.Spieler(1007, "andp", 1));
            spielIljig.addSpieler(new k.Spieler(1008, "andq", 1));
            spieler = new k.Spieler(1009, "andr", 1);
            spielIljig.addSpieler(spieler);
            spieler.should.have.property("nummer", 9);
            (function () {
                spielIljig.addSpieler(new k.Spieler(1010, "ands", 1))
            }).should.throw({ name : "ZuVieleSpieler" });
        });

        it("should throw an exception because of wrong state", function() {
            spielIljig.status = "grumpf";
            (function () {
                spielIljig.addSpieler(new k.Spieler(1010, "ands", 1));
            }).should.throw({ name : "SpielLaeuftSchon" });
        });
    });

    describe("#starten", function() {
        it("should throw an exception because too few players added", function() {
            (function() {
                spielIljig.starten();
            }).should.throw({ name : "ZuWenigeSpieler" });
        });

        it("should start the game", function() {
            spielIljig.addSpieler(new k.Spieler(1000, "andi", 1));
            spielIljig.addSpieler(new k.Spieler(1001, "andj", 1));
            spielIljig.starten();
            spielIljig.should.have.property("status", s.SpielIljig.STATUS.zug);
        });
    });
});
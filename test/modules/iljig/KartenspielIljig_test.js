var k, log4js, logger;
require("should");
log4js = require("log4js");
logger = log4js.getLogger("iljig.KartenspielIljig_test");

k = require("../../../modules/iljig/KartenspielIljig.js");

describe("KartenspielIljig", function() {
    var kartenspielIljig;
    beforeEach(function() {
        logger.debug("KartenspielIljig-beforeEach: instanziere KartenspielIljig");
        kartenspielIljig = new k.KartenspielIljig();
        logger.debug("Anzahl Karten: " + kartenspielIljig.karten.length);
    });

    describe("#init", function() {
        it("should initialize all cards of the game", function() {
            kartenspielIljig.getKarte("karo", "K").should.not.be.null();
            kartenspielIljig.karten.length.should.be.equal(43, "10 of each color and 3 Jokers");
        });
    });

});


describe("StapelIljig", function() {
    var stapelIljig;
    beforeEach(function () {
        stapelIljig = new k.StapelIljig();
        stapelIljig.addKarte(new k.Karte("VISA", "4711"));
        stapelIljig.addKarte(new k.Karte("AmEx", "4712"));
    });

    describe("#getTrumpf", function() {
       it("should return color of lowest card of pile", function() {
           stapelIljig.getTrumpf().should.be.equal("VISA", "lowest card in pile designates trump color");
       });
    });
});

describe("GeberIljig", function() {
    var geberIljig, Mock, stapelMock, spielerMocks, tests;

    tests = [
        {args: {spieler: 1},    expected: { proSpieler : 0, stapel : 43}},
        {args: {spieler: 2},    expected: { proSpieler : 7, stapel : 29}},
        {args: {spieler: 3},    expected: { proSpieler : 7, stapel : 22}},
        {args: {spieler: 4},    expected: { proSpieler : 7, stapel : 15}},
        {args: {spieler: 5},    expected: { proSpieler : 5, stapel : 18}},
        {args: {spieler: 6},    expected: { proSpieler : 5, stapel : 13}},
        {args: {spieler: 7},    expected: { proSpieler : 3, stapel : 22}},
        {args: {spieler: 8},    expected: { proSpieler : 3, stapel : 19}},
        {args: {spieler: 9},    expected: { proSpieler : 3, stapel : 16}},
        {args: {spieler: 10},   expected: { proSpieler : 3, stapel : 13}},
        {args: {spieler: 11},   expected: { proSpieler : 0, stapel : 43}}
    ];


    before(function () {
        Mock = function () {
            this.karten = [];
            this.addKarte = function (k) {
                this.karten.push(k);
            };
            this.addHandKarte = function (k) {
                this.karten.push(k);
            };
        };
    });

    beforeEach(function () {
        stapelMock = new Mock();
        spielerMocks = [];
        geberIljig = new k.GeberIljig();
    });

    describe("#gib", function() {

        tests.forEach(function(test) {
            it("should give " + test.expected.proSpieler + " cards to each player", function () {
                var i;
                for (i = 0; i < test.args.spieler; i++) {
                    spielerMocks.push(new Mock());
                }
                geberIljig.gib(stapelMock, spielerMocks);

                for (i = 0; i < test.args.spieler; i++) {
                    spielerMocks[i].karten.length.should.be.equal(test.expected.proSpieler,
                        "having " + test.args.spieler + " players player " + i + " receives " + test.expected.proSpieler + " cards");
                }
                stapelMock.karten.length.should.be.equal(test.expected.stapel,
                    "having " + test.args.spieler + " players pile receives " + test.expected.stapel + " cards");
            });
        });
    });
});

describe("HandSorterIljig", function () {
   var handSorterIljig, testsWeight, testsSort,
       CARD1_GREATER = true, CARD2_GREATER = false;

   testsWeight = [
       { args : { karte: new k.Karte("herz", "7") }, expected : 1010 },
       { args : { karte: new k.Karte("herz", "A") }, expected : 1100 },
       { args : { karte: new k.Karte("karo", "7") }, expected : 11 },
       { args : { karte: new k.Karte("karo", "K") }, expected : 71 },
       { args : { karte: new k.Karte("pik", "A") }, expected : 103 },
       { args : { karte: new k.Karte("J", "1") }, expected : 2002 },
       { args : { karte: new k.Karte("J", "2") }, expected : 2001 },
       { args : { karte: new k.Karte("J", "3") }, expected : 2000 }
   ];

   testsSort = [
       { args : {karte1: new k.Karte("herz", "8"), karte2: new k.Karte("herz", "7")}, expected : CARD1_GREATER },
       { args : {karte1: new k.Karte("J", "1"), karte2: new k.Karte("J", "2")}, expected : CARD1_GREATER },
       { args : {karte1: new k.Karte("J", "3"), karte2: new k.Karte("herz", "A")}, expected : CARD1_GREATER },
       { args : {karte1: new k.Karte("kreuz", "2"), karte2: new k.Karte("kreuz", "A")}, expected : CARD2_GREATER },
       { args : {karte1: new k.Karte("kreuz", "3"), karte2: new k.Karte("kreuz", "2")}, expected : CARD2_GREATER },
       { args : {karte1: new k.Karte("karo", "8"), karte2: new k.Karte("herz", "7")}, expected : CARD2_GREATER }
   ];

   beforeEach(function () {
       handSorterIljig = new k.HandSorterIljig("herz");
   });
   describe("#calculateWeight", function() {
       testsWeight.forEach(function(test) {
          it("card " + test.args.karte.toString() + " should have weight " + test.expected, function () {
              handSorterIljig.calculateWeight(test.args.karte).should.be.equal(test.expected);
          });
       });
   });

   describe("#sortFunction", function () {
       testsSort.forEach(function(test) {
           it("card " + test.args.karte1.toString() + " should be "
                + (test.expected ? "greater" : "less")
                + " than " + test.args.karte2.toString(),
               function () {
                   (handSorterIljig.sortFunction(test.args.karte1, test.args.karte2) > 0).should.be.equal(test.expected);
           });
       });

       it("cards should be equal", function () {
           handSorterIljig.sortFunction(new k.Karte("karo", "A"), new k.Karte("karo", "A")).should.be.equal(0, "difference of weights should be 0");
       });
   });
});
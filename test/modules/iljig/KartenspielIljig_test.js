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
/**
 * Created with JetBrains WebStorm.
 * User: andreas
 * Date: 12.01.13
 * Time: 15:54
 * To change this template use File | Settings | File Templates.
 */

var k = require("./../Kartenspiel.js"),
    KartenspielIljig, StapelIljig, GeberIljig, HandSorterIljig;

KartenspielIljig = function() {
    this.init();
};
KartenspielIljig.prototype = Object.create(k.Kartenspiel.prototype, {
    name : {
        value : "Iljig"
    },
    init : {
        value : function() {
            var that = this,
                createFarbe = function (farbe) {
                    var i;
                    for (i = 7; i <= 10; i++) {
                        that.addKarte(farbe, "" + i);
                    }
                    that.addKarte(farbe, "B");
                    that.addKarte(farbe, "D");
                    that.addKarte(farbe, "K");
                    that.addKarte(farbe, "3");
                    that.addKarte(farbe, "2");
                    that.addKarte(farbe, "A");
                };

            createFarbe("karo");
            createFarbe("herz");
            createFarbe("pik");
            createFarbe("kreuz");
            this.addKarte("J", "3");
            this.addKarte("J", "2");
            this.addKarte("J", "1");
        }
    }
});

StapelIljig = function() {
    k.Stapel.call(this);
    this.trumpf = null;
};

StapelIljig.prototype = Object.create(k.Stapel.prototype, {
    getTrumpf : {
        value : function () {
            var farbe;
            if (!this.trumpf && this.karten.length > 0) {
                farbe = this.karten[0].farbe;
                if (farbe === "J") {
                    farbe = "herz";
                }
                this.trumpf = farbe;
            }
            return this.trumpf;
        }
    },
    toString : {
        value : function () {
            return "StapelIljig[Trumpf:" + this.trumpf + ", Karten=[" + this.karten + "]]";
        }
    },
    toDb : {
        value : function() {
            var i, karte;
            for (i = 0; i < this.karten[i]; i++) {

            }
        }
    }
});

GeberIljig = function () {
};

GeberIljig.SPIELER_ANZAHL_KARTEN = {
        minAnzahl : 2,
        maxAnzahl : 10,
        2 : 7,
        3 : 7,
        4 : 7,
        5 : 5,
        6 : 5,
        7 : 3,
        8 : 3,
        9 : 3,
        10 : 3
};

GeberIljig.prototype = Object.create(Object.prototype, {
    gib : {
        value : function (stapel, /* Array */ spieler) {
            var k = 0, i, s,
                kartenspiel = new KartenspielIljig(),
                karten,
                gemischteKarten, mischen;

            mischen = function () {
                return Math.random() - 0.5;
            };

            karten = kartenspiel.getKarten();
            gemischteKarten = karten.slice(0, karten.length);
            gemischteKarten.sort(mischen);

            for (i = 0; i < GeberIljig.SPIELER_ANZAHL_KARTEN[spieler.length]; i++) {
                for (s = 0; s < spieler.length; s++) {
                    spieler[s].addHandKarte(gemischteKarten[k]);
                    k++;
                }
            }

            for (; k < gemischteKarten.length; k++) {
                stapel.addKarte(gemischteKarten[k]);
            }
        }
    }
});

HandSorterIljig = function(trumpf) {
    k.HandSorter.call(this, trumpf);
};

HandSorterIljig.prototype = Object.create(k.HandSorter.prototype, {
    calculateWeight : {
        value : function(/* Karte */ karte) {
            var farbe = karte.farbe, weight = 0,
                weightMap = {
                    "7" : 10,
                    "8" : 20,
                    "9" : 30,
                    "10" : 40,
                    "B" : 50,
                    "D" : 60,
                    "K" : 70,
                    "3" : 80,
                    "2" : 90,
                    "A" : 100,
                    "karo" : 1,
                    "herz" : 2,
                    "pik" : 3,
                    "kreuz" : 4
                };

            if (farbe === this.trumpf) {
                weight = 1000;
                weight = weight + weightMap[karte.wert];
            } else if (farbe === "J") {
                weight = 2000;
                weight = weight + 3 - parseInt(karte.wert, 10);
            } else {
                weight = weightMap[farbe];
                weight = weight + weightMap[karte.wert];
            }

            return weight;
        }
    },
    sortFunction : {
        value : function (/* Karte */ a, /* Karte */ b) {
            return this.calculateWeight(a) - this.calculateWeight(b);
        }
    }
});

exports.KartenspielIljig = KartenspielIljig;
exports.StapelIljig = StapelIljig;
exports.GeberIljig = GeberIljig;
exports.HandSorterIljig = HandSorterIljig;
exports.Spieler = k.Spieler;
exports.Karte = k.Karte;
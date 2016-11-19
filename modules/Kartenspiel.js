/**
 * Created with JetBrains WebStorm.
 * User: andreas
 * Date: 12.01.13
 * Time: 15:30
 * To change this template use File | Settings | File Templates.
 */

var Karte, Kartenspiel, Spieler, Stapel, HandSorter, u;

u = require("./Util.js");

Karte = function(farbe, wert) {
    this.farbe = farbe;
    this.wert = wert;
};

Karte.prototype = Object.create(Object.prototype, {
    toString : {
        value : function()
        {
            return "Karte[" + this.farbe + "-" + this.wert + "]";
        }
    },
    toDb : {
        value : function() {
            return {
                farbe : this.farbe,
                wert : this.wert
            }
        }
    },
    stringify : {
        value : function() {
            return JSON.stringify(this.toDb(), 0, 4);
        }
    }
});


Kartenspiel = function() {
    this.name = "Kartenspiel";
    this.kartenMap = {};
    this.karten = [];
};

Kartenspiel.prototype = Object.create(Object.prototype, {
    addKarte : {
        value : function (farbe, wert) {
            var karte = new Karte(farbe, wert),
                addKarteToMap = function (key, key2, karte) {
                var map;
                map = this.kartenMap[key];

                if (!map) {
                    map = {};
                    this.kartenMap[key] = map;
                }
                map[key2] = karte;
            };

            this.karten.push(karte);

            addKarteToMap.call(this, farbe, wert, karte);
            addKarteToMap.call(this, wert, farbe, karte);
        }
    },
    getKarte : {
        value : function (farbe, wert) {
            return this.kartenMap[farbe][wert];
        }
    },
    getKartenFarbe : {
        value : function (farbe) {
            return this.kartenMap[farbe];
        }
    },
    getKartenWert : {
        value : function (wert) {
            return this.kartenMap[wert];
        }
    },
    getKarten : {
        value : function () {
            return this.karten;
        }
    },
    toString : {
        value : function () {
            return "Kartenspiel[" + this.getKartenspielName() + "]";
        }
    }
});

Spieler = function(id, name, spielId) {
    this.name = name;
    this.spielId = spielId;
    this.id = id || u.Util.uuid();
    this.nummer = null;
    this.hand = [];
};

Spieler.prototype = Object.create(Object.prototype, {
    toString : {
        value : function () {
            return "Spieler[" + this.name + ", " + this.hand + "]";
        }
    },
    addHandKarte : {
        value : function (/* Karte */ karte) {
            if (!this.hand) this.hand = [];
            this.hand.push(karte);
        }
    },
    sortHand : {
        value : function () {
            var that = this;
            this.hand.sort(
                function () {
                    return that.handSorter.sortFunction.apply(that.handSorter, arguments);
                });
        }
    },
    toDb : {
        value : function() {
            return {
                id : this.id,
                name : this.name,
                spielId : this.spielId,
                nummer : this.nummer
            }
        }
    }
});


Stapel = function () {
    this.karten = [];
};

Stapel.prototype = Object.create(Object.prototype, {
    toString : {
        value :function () {
            return "Stapel[" + this.karten + "]";
        }
    },
    addKarte : {
        value : function (/* Karte */ karte) {
            this.karten.push(karte);
        }
    }
});


HandSorter = function() {
};

HandSorter.prototype = Object.create(Object.prototype, {
    sortFunction : {
        value : function (/* Karte */ a, /* Karte */ b) {
            return a.toString() < b.toString() ? -1 : (a.toString() === b.toString() ? 0 : 1);
        }
    }
});

exports.Karte = Karte;
exports.Kartenspiel = Kartenspiel;
exports.HandSorter = HandSorter;
exports.Spieler = Spieler;
exports.Stapel = Stapel;
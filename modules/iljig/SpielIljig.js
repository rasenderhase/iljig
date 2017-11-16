/**
 * Created with JetBrains WebStorm.
 * User: andreas
 * Date: 13.02.13
 * Time: 21:18
 *
 * Verschiedene Stadien eines Spiels:
 * - Angelegt: Es können Spieler hinzugefügt werden
 * * Übergang: Maximalanzahl an Spielern erreicht oder Spiel wird vom ersten Spieler gestartet
 *             und Minimalanzahl an Spielern vorhanden
 * - Gestartet: Es wird gemischt und gegeben, i = 0, s = 0, n = Anzahl der Spieler
 * * Übergang: -
 * - ZugSpieler[i % n]: Spieler[i % n] wählt die zu spielenden Karten abhängig vom Tisch, s++
 * * Übergang: Spieler[i % n] bestätigt die zu spielenden Karten oder Spieler[i % n] passt (d.h. nimmt die Karten).
 * - Spieler[i % n] füllt seine Karten auf (automatisch)
 * * Übergang
 * - hier gibt es mehrere Möglichkeiten:
 *      1. Der nächste Spieler ist an der Reihe: (s < n) oder Spieler[i % n] hat gepasst. i++
 *      3. Der Stich ist zu Ende und der nächste Spieler ist an der Reihe: Tisch wird geleert; s = n; i++;
 *      2. Das Spiel ist zu Ende: Spieler[i % n] hat keine Karten mehr und der Stapel ist leer.
 */


var SpielIljig, k, u, s, log4js, logger;
u = require("../Util.js").Util;
k = require("./KartenspielIljig.js");
log4js = require("log4js");
logger = log4js.getLogger("iljig.SpielIljig");


SpielIljig = function (id, adminGeheimnis) {
    this.id = id || u.uuid();
    this.teilnahmeGeheimnis = u.uuid();
    this.adminGeheimnis = adminGeheimnis || u.uuid();
    this.status = SpielIljig.STATUS.angelegt;
    this.trumpf = null;
    this.spielerNummerAnDerReihe = 0;
    this.lastAccess = Date.now();

    this.stapel = new k.StapelIljig();
    this.tisch = null;      //TODO Tisch programmieren
    this.spieler = [];
};

SpielIljig.STATUS = {
        angelegt : "Angelegt",
            gestartet : "Gestartet",
            zug : "Zug",
            ende : "Ende"
};
SpielIljig.MAX_SPIEL_ALTER = 1000 * 60 * 60 * 24;   // 1 Tag

SpielIljig.prototype = Object.create(Object.prototype, {
    addSpieler : {
        value : function(/* Spieler */ spieler) {
            if (this.status !== SpielIljig.STATUS.angelegt) {
                throw {
                    name : "SpielLaeuftSchon",
                    message : "Es können keine weiteren Spieler mehr teilnehmen."
                };
            }

            if (this.spieler.length >= k.GeberIljig.SPIELER_ANZAHL_KARTEN.maxAnzahl) {
                throw {
                    name : "ZuVieleSpieler",
                    message : "Es sind höchstens " + k.GeberIljig.SPIELER_ANZAHL_KARTEN.maxAnzahl + " Spieler erlaubt."
                };
            }
            spieler.nummer = this.spieler.length;
            this.spieler.push(spieler);
        }
    },
    /**
     * Injiziert den Handsorter und
     * sortiert die Handkarten aller Spieler
     */
    sortSpielerHand: {
        value : function () {
            var i, einSpieler,
                handSorter = new k.HandSorterIljig(this.trumpf);
            for (i in this.spieler) {
                if (!this.spieler.hasOwnProperty(i)) {
                    continue;
                }
                einSpieler = this.spieler[i];
                einSpieler.handSorter = handSorter;
                einSpieler.sortHand();
                logger.debug("" + einSpieler);
            }
        }
    },
    starten : {
        value : function () {
            var geber;

            if (this.spieler.length < k.GeberIljig.SPIELER_ANZAHL_KARTEN.minAnzahl) {
                throw {
                    name : "ZuWenigeSpieler",
                    message : "Es müssen mindestens " + k.GeberIljig.SPIELER_ANZAHL_KARTEN.minAnzahl + " Spieler mitspielen."
                };
            } else if (this.status === SpielIljig.STATUS.angelegt) {
                this.status = SpielIljig.STATUS.gestartet;
                geber = new k.GeberIljig();
                geber.gib(this.stapel, this.spieler);
                this.trumpf = this.stapel.getTrumpf();

                this.sortSpielerHand();
                logger.debug("" + this.stapel);

                this.spielerNummerAnDerReihe = Math.floor(Math.random() * this.spieler.length);
                this.status = SpielIljig.STATUS.zug;
            }
        }
    },
    /**
     * spieler: Der Spieler, der an der Reihe ist
     * karten: Die Karten, die er gespielt hat. Wenn die karten leer sind,
     * dann hat er gepasst. D.h., er muss alle Karten vom Tisch nehmen.
     *
     * Wenn der Spieler Karten gespielt hat:
     * 1. Prüfen, ob er die Karten hat (Hacker-Abwehr)
     * 2. Prüfen, ob es eine ungerade Anzahl ist
     * 3. Prüfen, ob es sich um ein "Mas" handelt
     * 4. Prüfen, ob höchstens so viel Karten gespielt wurden, wie der Spieler mit den wenigsten Karten auf der Hand hat
     * 5. Prüfen, ob höchstens GeberIljig.SPIELER_ANZAHL_KARTEN[spieler.length] - 2 Karten gespielt wurden (Stapel nicht leer)
     * oder
     * 5. Prüfen, ob höchstens GeberIljig.SPIELER_ANZAHL_KARTEN[alleSpieler.length] Karten gespielt wurden (Stapel leer)
     * Prüfungen des Tischs:
     * 1. Ist der Tisch leer?
     * oder
     * 1. Wurden gleich viel Karten gespielt, wie auf dem Tisch oben liegen?
     * 2. Kann jede gespielte Karte eine oben liegende Karte übertrumpfen?
     */
    spielen : {
        value : function (/* Spieler */ spieler, /* Karte[] */ karten) {

        }
    },
    toDb : {
        value : function() {
            return {
                id : this.id,
                status : this.status,
                trumpf : this.trumpf,
                teilnahmeGeheimnis : this.teilnahmeGeheimnis,
                adminGeheimnis : this.adminGeheimnis,
                spielerNummerAnDerReihe : this.spielerNummerAnDerReihe,
                lastAccess : this.lastAccess
            };
        }
    }
});

exports.SpielIljig = SpielIljig;

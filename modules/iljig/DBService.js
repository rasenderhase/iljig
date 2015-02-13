/**
 * Created with JetBrains WebStorm.
 * User: andreas
 * Date: 13.02.13
 * Time: 22:18
 * To change this template use File | Settings | File Templates.
 *
 * Datenmodell:
 *
 * spiel -- 1:n -- spieler
 * spieler -- 1:n -- spielerkarten     (Karten auf der Hand eines Spielers)
 * spiel -- 1:n -- stapelkarten        (Karten im Stapel)
 * spiel -- 1:n -- spielerStich
 * spielerStich -- 1:n -- spielerStichkarten (von einem Spieler in einem Stich gespielte Karten)
 */

var DbService,
    s = require("./SpielIljig.js"),
    k = require("./KartenspielIljig.js"),
    Promise = require('promise'),
    u = require("../Util.js").Util,
    log4js = require('log4js');

var logger = log4js.getLogger("iljig.DbService");

DbService = function() {
    this.db = {
        spiel : {},
        spieler : {},
        spielerKarten : {},
        stapelKarten : {},
        spielerStichKarten : {},
        spielerStich : {},
        index : {
            spielSpieler : {}
        }
    };
};

DbService.prototype = Object.create(Object.prototype, {
    saveSpiel : {
        value : function(/* SpielIljig */ spiel) {
            return new Promise(function (/* function */ resolve, /* function */ reject) {
                try {
                    spiel.lastAccess = Date.now();
                    this.db.spiel[spiel.id] = spiel.toDb();
                    if (!this.db.index.spielSpieler[spiel.id]) {
                        this.db.index.spielSpieler[spiel.id] = {};
                    }
                    logger.debug("saveSpiel -> resolve");
                    resolve();
                } catch (e) { reject(e); }
            }.bind(this));      //fn.bind(this) entspricht $.proxy(fn, this)
        }
    },

    getSpiel : {
        value : function(/* String */ id) {
            return new Promise(function (/* function */ resolve, /* function */ reject) {
                var spiel,
                    result = null;
                try {
                    this.deleteAlteSpiele(s.SpielIljig.MAX_SPIEL_ALTER);

                    //asynchrone Verarbeitung starten...
                    this.getSpielerBySpiel(id).done(function (results) {

                        if (this.db.spiel[id]) {
                            spiel = new s.SpielIljig();
                            this.db.spiel[id].lastAccess = Date.now();
                            spiel.extend(this.db.spiel[id]);                //Persistierte Daten überbraten

                            spiel.spieler = results.spielerList;
                            result = spiel;
                        }

                        logger.debug("getSpiel -> resolve");
                        resolve(result);
                    }.bind(this), u.err());

                } catch (e) { reject(e); }
            }.bind(this));
        }
    },
    getSpielList : {
        value : function() {
            return new Promise(function (/* function */ resolve, /* function */ reject) {
                var i, list = [],
                    spiel,
                    spielerList,
                    spielerPromises = [],
                    result = null;

                try {
                    this.deleteAlteSpiele(s.SpielIljig.MAX_SPIEL_ALTER);

                    for (i in this.db.spiel) {
                        if (this.db.spiel.hasOwnProperty(i)) {
                            spielerPromises.push(this.getSpielerBySpiel(this.db.spiel[i].id));
                        }
                    }

                    Promise.all(spielerPromises).done(function (results) {
                        var i, id, spielerList;

                        for (i in results) {
                            id = results[i].spielId;
                            if (this.db.spiel[id]) {
                                spiel = new s.SpielIljig();
                                spiel.extend(this.db.spiel[id]);                //Persistierte Daten überbraten

                                spiel.spieler = results[i].spielerList;
                                list.push(spiel);
                            }
                        }
                        result = list;
                        logger.debug("getSpielList -> resolve");
                        resolve(result);
                    }.bind(this), u.err());

                } catch (e) { reject(e); }
            }.bind(this));
        }
    },

    deleteAlteSpiele : {
        value : function(/* Date */ maxAlterMs) {
            return new Promise(function (/* function */ resolve, /* function */ reject) {
                var i = null, j= null, spiel, index,
                    minDate = Date.now() - maxAlterMs;
                try {
                    for (i in this.db.spiel) {
                        if (this.db.spiel.hasOwnProperty(i)) {
                            if (this.db.spiel[i].lastAccess < minDate) {
                                spiel = this.db.spiel[i];
                                index = this.db.index.spielSpieler[spiel.id];
                                for (j in index) {
                                    if (index.hasOwnProperty(j)) {
                                        delete this.db.spieler[j];
                                    }
                                }

                                delete this.db.spiel[i];
                            }
                        }
                    }
                    logger.debug("deleteAlteSpiele -> resolve");
                    resolve();
                } catch (e) { reject(e); }
            }.bind(this));
        }
    },

    saveSpieler : {
        value : function(/* k.Spieler */ spieler) {
            return new Promise(function (/* function */ resolve, /* function */ reject) {
                try {
                    this.db.spieler[spieler.id] = spieler.toDb();
                    this.db.index.spielSpieler[spieler.spielId][spieler.id] = spieler.id;
                    logger.debug("saveSpieler -> resolve");
                    resolve();
                } catch (e) { reject(e); }
               }.bind(this));
        }
    },
    getSpieler : {
        value : function(/* String */ id) {
            return new Promise(function (/* function */ resolve, /* function */ reject) {
                var spieler,
                    result = null;
                try {
                    if (this.db.spieler[id]) {
                        spieler = new k.Spieler();
                        spieler.extend(this.db.spieler[id]);
                        result = spieler;
                    }

                    logger.debug("getSpieler -> resolve");
                    resolve(result);
                } catch (e) { reject(e); }
            }.bind(this));
        }
    },
    getSpielerBySpiel : {
        value : function(/* String */ spielId) {
            return new Promise(function (/* function */ resolve, /* function */ reject) {
                var spielerList = [],
                    spieler,
                    spielIndex,
                    spielerId,
                    result = null;
                try {
                    spielIndex = this.db.index.spielSpieler[spielId];
                    for (spielerId in spielIndex) {
                        if (spielIndex.hasOwnProperty(spielerId)) {
                            spieler = new k.Spieler();
                            spieler.extend(this.db.spieler[spielerId]);
                            spielerList.push(spieler);
                            spielerList.sort(function (a, b) { return a.nummer - b.nummer});
                        }
                    }
                    result = {
                        spielerList : spielerList,
                        spielId : spielId
                    };
                    logger.debug("getSpielerBySpiel -> resolve");
                    resolve(result);
                } catch (e) { reject(e); }
            }.bind(this));
        }
    },
    saveSpielerKarten : {
        value : function (/* Spieler */ spieler) {
            return new Promise(function (/* function */ resolve, /* function */ reject) {
                var i = 0, karte;
                try {
                    this.db.spielerKarten[spieler.id] = [];
                    for (i = 0; i < spieler.hand.length; i++) {
                        karte = spieler.hand[i];
                        this.db.spielerKarten[spieler.id].push(karte.toDb());
                    }
                    logger.debug("saveSpielerKarten -> resolve");
                    resolve();
                } catch (e) { reject(e); }
            }.bind(this));
        }
    },
    getSpielerKarten : {
        value : function(/* Spieler */ spieler) {
            return new Promise(function (/* function */ resolve, /* function */ reject) {
                var karten, karte, i = 0,
                    result = null;
                try {
                    if (spieler) {
                    karten = this.db.spielerKarten[spieler.id];
                        if (karten) {
                            for (i = 0; i < karten.length; i++) {
                                karte = new k.Karte();
                                karte.extend(karten[i]);
                                spieler.addHandKarte(karte);
                            }
                        }
                    }
                    result = spieler;
                    logger.debug("getSpielerKarten -> resolve");
                    resolve(result);
                } catch (e) { reject(e); }
            }.bind(this));
        }
    }
});

exports.dbService = new DbService();
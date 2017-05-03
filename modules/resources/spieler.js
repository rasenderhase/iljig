/**
 * Created with JetBrains WebStorm.
 * User: andreas
 * Date: 02.03.13
 * Time: 15:02
 * To change this template use File | Settings | File Templates.
 */

var dbService = require("../iljig/DBService.js").dbService,
    Promise = require("promise"),
    log4js = require("log4js"),
    logger = log4js.getLogger("resources.spieler");
    k = require("../iljig/KartenspielIljig.js"),
    u = require("../Util.js").Util,
    s = require("../iljig/SpielIljig.js");

exports.load = function(req, res, next){
    var spielerId = req.param("spieler_id", null),
        spielId = req.param("spiel_id", null);

    Promise.all([
        dbService.getSpiel(spielId),
        dbService.getSpieler(spielerId)
    ]).done(function (results) {
            var spieler = results[1];
            dbService.getSpielerKarten(spieler).done(function (/* result */) {
                req.atts = {
                    spiel : results[0],
                    spieler : results[1]
                };
                next();
            }, u.err(next));
        }, u.err(next));
};

exports.save = function(req, res, next){
    var id = req.param("spieler_id", null),
        adminGeheimnis = req.param("adminGeheimnis", null),
        teilnahmeGeheimnis = req.param("teilnahmeGeheimnis", null),
        spielerName = req.param("spielerName", null),
        karten = req.param("karte", null),
        spieler = req.atts.spieler,
        spiel = req.atts.spiel,
        callback;

    callback = function() {
        res.header("location", req.path);
        next();
    };

    if (!spiel) {
        callback();
    } else if (!spieler) {
        //Spieler hinzufügen : adminGeheimnis oder teilnahmeGeheimnis muss vorhanden sein
        if (teilnahmeGeheimnis !== spiel.teilnahmeGeheimnis
            && adminGeheimnis !== spiel.adminGeheimnis) {
            //Wenn weder teilnahmeGeheimnis noch adminGeheimnis stimmen,
            //muss es sich um einen Hacker handlen
            next("Hacker!");
        } else {
            spieler = new k.Spieler(id, spielerName, spiel.id);
            spiel.addSpieler(spieler);                              //TODO ???
            req.atts.spieler = spieler;
            res.status(201);
            dbService.saveSpieler(spieler).done(callback, u.err(next));
        }
    } else if (spieler.nummer === spiel.spielerNummerAnDerReihe) {
        logger.debug("Gespielte Karten: " + karten);
        callback();
    } else {
        callback();
    }
};

exports.view = function(req, res){
    var spiel = req.atts.spiel,
        spieler = req.atts.spieler,
        renderOptions = {};

    renderOptions.spiel = spiel;
    renderOptions.spieler = spieler;
    renderOptions.spielerAnDerReihe =
        spiel
        && spiel.status === s.SpielIljig.STATUS.zug
        && spiel.spielerNummerAnDerReihe === spieler.nummer;
    renderOptions.layout = "spielSpieler";

    res.render("spielSpieler", renderOptions);
};
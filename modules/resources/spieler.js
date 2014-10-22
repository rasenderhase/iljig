/**
 * Created with JetBrains WebStorm.
 * User: andreas
 * Date: 02.03.13
 * Time: 15:02
 * To change this template use File | Settings | File Templates.
 */

var dbService = require("../iljig/DBService.js").dbService,
    Promise = require("promise"),
    u = require("../Util.js").Util;

exports.load = function(req, res, next){
    var spielerId = req.param("spieler_id"),
        spielId = req.param("spiel_id");

    Promise.all([
        dbService.getSpiel(spielId),
        dbService.getSpieler(spielerId)
    ]).done(function (results) {
            req.atts = {
                spiel : results[0],
                spieler : results[1]
            };
            next();
        }, u.err(next));
};

exports.save = function(req, res, next){
    var id = req.param("spieler_id"),
        adminGeheimnis = req.param("adminGeheimnis"),
        teilnahmeGeheimnis = req.param("teilnahmeGeheimnis"),
        spielerName = req.param("spielerName"),
        spieler = req.atts.spieler,
        spiel = req.atts.spiel,
        callback;

    callback = function() {
        res.header("location", req.path);
        next();
    };

    if (teilnahmeGeheimnis !== spiel.teilnahmeGeheimnis
        && adminGeheimnis !== spiel.adminGeheimnis) {
        //Wenn weder teilnahmeGeheimnis noch adminGeheimnis stimmen,
        //muss es sich um einen Hacker handlen
        next("Hacker!");
    } else if (!spieler) {
        spieler = new k.Spieler(id, spielerName, spiel.id);
        spiel.addSpieler(spieler);                              //TODO ???
        req.atts.spieler = spieler;
        res.status(201);
        dbService.saveSpieler(spieler).done(callback, u.err(next));
    } else callback();
};

exports.view = function(req, res){
    var spiel = req.atts.spiel,
        spieler = req.atts.spieler,
        renderOptions = {};

    renderOptions.spiel = spiel;
    renderOptions.spieler = spieler;
    renderOptions.layout = "spielSpieler";

    res.render("spielSpieler", renderOptions);
};
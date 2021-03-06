/**
 * Created with JetBrains WebStorm.
 * User: andreas
 * Date: 02.03.13
 * Time: 15:02
 * To change this template use File | Settings | File Templates.
 */

var dbService = require("../iljig/DBService.js").dbService,
    s = require("../iljig/SpielIljig.js"),
    u = require("../Util.js").Util,
    url = require("url"),
    Promise = require("promise");

exports.home = function(req, res) {
    var spielId = u.uuid(),
        adminGeheimnis = u.uuid();
    res.cookie("adminGeheimnis", adminGeheimnis, {
        path: "./spiel/" + spielId,
//      maxAge : -1,         //Browser session cookie
        httpOnly: true      //Cookie darf vom Client nicht angefasst werden.
    });
    res.render("home", {
        spiel : {
            id : spielId,
            adminGeheimnis : adminGeheimnis
        }
    });
};

exports.load = function(req, res, next){
    var id = req.param("spiel_id", null);

    dbService.getSpiel(id).done(function (spiel) {
        req.atts = {
            spiel : spiel
        };
        next();
    }, u.err(next));
};

exports.save = function(req, res, next){
    var id = req.param("spiel_id", null),
        adminGeheimnis = req.param("adminGeheimnis", null),
        spiel = req.atts.spiel,
        status = spiel ? spiel.status : null,
        callback, saveLaufendesSpiel, i, promises = [];

    callback = function() {
        res.header("location", req.path);
        next();
    };

    saveLaufendesSpiel = function() {
        var finalCallback;
        if (adminGeheimnis === spiel.adminGeheimnis
            && req.body.status === s.SpielIljig.STATUS.gestartet) {
            spiel.starten();
            promises.push(dbService.saveSpiel(spiel));
            for (i in spiel.spieler) {
                if (!spiel.spieler.hasOwnProperty(i)) {
                    continue;
                }
                promises.push(dbService.saveSpielerKarten(spiel.spieler[i]));
            }
            finalCallback = function () {
                Promise.all(promises).done(callback, u.err(next));
            };
        } else {
            finalCallback = next;
        }
        finalCallback();
    };

    switch (status) {
        case null:
            spiel = new s.SpielIljig(id, adminGeheimnis);
            req.atts.spiel = spiel;
            res.status(201);
            dbService.saveSpiel(spiel).done(callback, u.err(next));
            return;
        case s.SpielIljig.STATUS.angelegt:
            saveLaufendesSpiel();
            return;
        default:
            next();
            return;
    }
};

exports.view = function(req, res, next){
    var spiel = req.atts.spiel,
        teilnahmeGeheimnis = req.param("teilnahmeGeheimnis", null),
        adminGeheimnis = req.param("adminGeheimnis", null) || req.cookies.adminGeheimnis,
        renderOptions = {}, baseUrl;

    if (spiel === null) {
        next("Spiel ist null");
        return;
    }

    renderOptions.spiel = spiel;
    renderOptions.teilnahmeUrl = req.atts.teilnahmeUrl;
    renderOptions.adminGeheimnis = req.atts.adminGeheimnis;
    renderOptions.spielerAnDerReihe = spiel.spieler[spiel.spielerNummerAnDerReihe];
    if (spiel.teilnahmeGeheimnis === teilnahmeGeheimnis) {
        renderOptions.teilnehmer = true;
        renderOptions.teilnahmeGeheimnis = teilnahmeGeheimnis;
        renderOptions.spieler = { id : u.uuid() };
    }
    if (spiel.adminGeheimnis === adminGeheimnis) {
        renderOptions.teilnehmer = true;    //Ein Admin darf auch teilnehmen...
        renderOptions.teilnahmeGeheimnis = spiel.teilnahmeGeheimnis;
        renderOptions.spieler = { id : u.uuid() };
            baseUrl = url.parse(req.url);
        renderOptions.admin = true;
        renderOptions.teilnahmeUrl = req.protocol + "://" + req.get("host") + baseUrl.pathname + "?teilnahmeGeheimnis=" + spiel.teilnahmeGeheimnis;
        renderOptions.adminUrl = "?adminGeheimnis=" + adminGeheimnis;
    }

    res.render("spiel-" + spiel.status, renderOptions);
};

exports.list = function(req, res) {
    res.format({
        html : function() {
            dbService.getSpielList().done(function (spielList) {
                res.render("spiellist", {
                    spielList : spielList
                });
            }, u.err());
        },
        json : function() {
            dbService.getSpielList().done(function (spielList) {
                var i, json = [];
                for (i = 0; i < spielList.length; i++) {
                    json[i] = {
                        id : spielList[i].id,
                        status : spielList[i].status,
                        trumpf : spielList[i].trumpf,
                        spielerNummerAnDerReihe : spielList[i].spielerNummerAnDerReihe
                    };
                }
                res.json(json);
            }, u.err());
        }
    });
};
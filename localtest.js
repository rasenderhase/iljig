/**
 * Created with JetBrains WebStorm.
 * User: andreas
 * Date: 12.01.13
 * Time: 15:09
 * To change this template use File | Settings | File Templates.
 *
 * see http://www.bennadel.com/blog/2184-Object-create-Improves-Constructor-Based-Inheritance-In-Javascript-It-Doesn-t-Replace-It.htm
 */

var k = require("./modules/iljig/KartenspielIljig.js"),
    s = require("./modules/iljig/SpielIljig.js"),
    d = require("./modules/iljig/DBService.js"),
    u = require("./modules/Util.js");

var spiel = new s.SpielIljig(u.Util.uuid());

var andi = new k.Spieler(1, "andi", spiel.id);
var martin = new k.Spieler(2, "martin", spiel.id);

spiel.addSpieler(andi);
spiel.addSpieler(martin);

console.dir(spiel);

spiel.starten();


console.log("" + andi);
console.log("" + martin);

console.dir(spiel, { depth : null });

var dbService = d.dbService;

dbService.saveSpiel(spiel);
dbService.saveSpieler(andi).done(function(res, err) { if (err) console.log(err); });
dbService.saveSpielerKarten(andi);
dbService.saveSpieler(martin);
dbService.saveSpielerKarten(martin);

//Synchrone Abarbeitung. 1. saveSpiel, 2. getSpiel
var z = dbService.saveSpiel(spiel).done(dbService.getSpiel(spiel.id).done(function (res) {
    console.log("Result von getSpiel.done: ");
    console.dir(res);
    console.log("Aktuelle DB: ");
    console.dir(dbService, { depth : null });
}));


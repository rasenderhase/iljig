/**
 * Created with JetBrains WebStorm.
 * User: andreas
 * Date: 02.03.13
 * Time: 10:21
 * To change this template use File | Settings | File Templates.
 */


var express = require("express"),
    exphbs  = require("express3-handlebars"),
    i18n = require("i18next"),
    u = require("./modules/Util.js"),
    spiel = require("./modules/resources/spiel.js"),
    spieler = require("./modules/resources/spieler.js"),
    log4js = require("log4js"),
    conextRoot = "/iljig",
    logger = log4js.getLogger("server");

    app = express();

i18n.init({supportedLngs: ['en', 'de']});

app.engine("handlebars", exphbs({
    defaultLayout: "main",
    helpers : {
        t : i18n.t,
        contextRoot : function() { return conextRoot; }
    }
}));
app.set("view engine", "handlebars");

//app.use(express.logger('dev'));
app.use(i18n.handle);
app.use(express.errorHandler({ showStack: true, dumpExceptions: true }));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.favicon(__dirname + "/public/images/icon.png"));
app.use(express.static(__dirname + "/public"));
app.use(log4js.connectLogger(logger, { level: 'auto' }));

i18n.registerAppHelper(app);    //Register AppHelper so you can use the translate function inside template

app.get(conextRoot + "/", spiel.home);

app.get(conextRoot + "/spiel", spiel.list);

app.all(conextRoot + "/spiel/:spiel_id", spiel.load);
app.post(conextRoot + "/spiel/:spiel_id", spiel.save);
app.all(conextRoot + "/spiel/:spiel_id", spiel.view);

app.all(conextRoot + "/spiel/:spiel_id/spieler/:spieler_id", spieler.load);
app.post(conextRoot + "/spiel/:spiel_id/spieler/:spieler_id", spieler.save);
app.all(conextRoot + "/spiel/:spiel_id/spieler/:spieler_id", spieler.view);

app.get(conextRoot, function (req, res) { res.redirect(conextRoot + "/") });

app.listen(3000);
console.log("Listening on port 3000");
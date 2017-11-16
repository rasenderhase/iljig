/**
 * Created with JetBrains WebStorm.
 * User: andreas
 * Date: 02.03.13
 * Time: 10:21
 * To change this template use File | Settings | File Templates.
 */


require("amd-loader");

var
    express = require("express"),
    exphbs  = require("express-handlebars"),
    errorhandler = require("errorhandler"),
    cookieParser = require("cookie-parser"),
    bodyParser = require("body-parser"),
    favicon = require("serve-favicon"),
    i18n = require("i18next"),
    FilesystemBackend = require("i18next-node-fs-backend"),
    sprintf = require("i18next-sprintf-postprocessor"),
    i18nMiddleware = require("i18next-express-middleware"),
    spiel = require(__dirname + "/modules/resources/spiel.js"),
    spieler = require(__dirname + "/modules/resources/spieler.js"),
    log4js = require("log4js"),
    conextRoot = "/iljig",
    logger = log4js.getLogger("server"),
    hbs, test,
    tv = require(__dirname + "/share/iljig/tischValidator.js"),

    app = express();

i18n
    .use(i18nMiddleware.LanguageDetector)
    .use(FilesystemBackend)
    .use(sprintf)
    .init({
        fallbackLng: "de",
        preload: ["en", "de"],
        detection: {
            // order and from where user language should be detected
            order: [/*"path", "session", "querystring", "cookie", */ "header"]
        },
        backend: {
            loadPath: __dirname + "/locales/{{lng}}/{{ns}}.json",
            // path to post missing resources
            addPath: __dirname + "/locales/{{lng}}/{{ns}}.missing.json",

            // jsonIndent to use when storing json files
            jsonIndent: 2
        }
    });

hbs = exphbs.create({
    defaultLayout: "main",
    helpers : {
        t : function(key, options) {
            var result = i18n.t(key, options.hash);
            return new hbs.handlebars.SafeString(result);
        },
        //contextRoot helper allows the use of {{contextRoot}}/ in template (e.g. for URLs)
        contextRoot : function() { return conextRoot; }
    }
});

//noinspection JSUnusedGlobalSymbols
app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");

//app.use(express.logger("dev"));
app.use(i18nMiddleware.handle(i18n));
app.use(errorhandler({ showStack: true, dumpExceptions: true }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended : true }));
app.use(bodyParser.json());
app.use(favicon(__dirname + "/public/images/icon.png"));
app.use(conextRoot, express.static(__dirname + "/public"));
app.use(conextRoot, express.static(__dirname + "/share"));

app.use("apple-touch-icon-precomposed.png", express.static(__dirname + "/public/images/icon_100.png"));
app.use("apple-touch-icon.png", express.static(__dirname + "/public/images/icon_100.png"));

app.use(log4js.connectLogger(logger, { level: "auto" }));

//i18n.registerAppHelper(app);    //Register AppHelper so you can use the translate function inside template

app.get(conextRoot + "/", spiel.home);

app.get(conextRoot + "/spiel", spiel.list);

app.all(conextRoot + "/spiel/:spiel_id", spiel.load);
app.post(conextRoot + "/spiel/:spiel_id", spiel.save);
app.all(conextRoot + "/spiel/:spiel_id", spiel.view);

app.all(conextRoot + "/spiel/:spiel_id/spieler/:spieler_id", spieler.load);
app.post(conextRoot + "/spiel/:spiel_id/spieler/:spieler_id", spieler.save);
app.all(conextRoot + "/spiel/:spiel_id/spieler/:spieler_id", spieler.view);

app.get(conextRoot, function (req, res) { res.redirect(conextRoot + "/"); });

logger.info(tv.test());
app.listen(3000);
logger.info("Listening on port 3000");


/**
 * Created by andreas on 04.05.17.
 */
define([], function(){
    var exports = {};
    exports.test = function () {
        return 'This is a function from shared module';
    };

    exports.validate = function (/* Karte[] */ tischKarten, /* Karte[] */ karten, /* String */ trumpf) {
        return 'This is a function from shared module';
    };

    return exports;
});
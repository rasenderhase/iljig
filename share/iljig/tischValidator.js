/**
 * Created by andreas on 04.05.17.
 */
define([], function(){
    return {
        test : function () {
            console.log('This is a function from shared module');
        },
        validate : function (/* Karte[] */ tischKarten, /* Karte[] */ karten, /* String */ trumpf) {
            return 'This is a function from shared module';
        }
    };
});
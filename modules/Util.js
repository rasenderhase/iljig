/**
 * Created with JetBrains WebStorm.
 * User: andreas
 * Date: 13.02.13
 * Time: 22:21
 * To change this template use File | Settings | File Templates.
 */

var Util;

Util = function () {
};

Util.prototype = Object.create(Object.prototype, {
    uuid : {
        //see https://gist.github.com/jed/982883
        value : function b(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,b);}
    },
    err : {
        // create Error handler function
        value : function (next) {
            return function (err) {
                if (next) {
                    return next(err);
                }
                if (err) {
                    throw err;
                }
            }
        }
    }, 
    extend : {
        enumerable: false,
        value: function(dest, from) {
            var props = Object.getOwnPropertyNames(from);
            props.forEach(function(name) {
                if (name in dest) {
                    var destination = Object.getOwnPropertyDescriptor(from, name);
                    Object.defineProperty(dest, name, destination);
                }
            });
            return dest;
        }
    }
});

exports.Util = new Util();
let requireDirectory = require('require-directory');
let _ = require("lodash");

let db = null;

let visitor = function (obj) {
    return (/^Abstract/.test(obj.name) && obj.setDatabase && _.isFunction(obj.setDatabase)) ? obj.setDatabase(db) : obj;
}

module.exports = function (db_ref) {
    db = db_ref;
    return requireDirectory(module, {
        visit: visitor
    });
}
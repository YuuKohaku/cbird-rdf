"use strict";

var requireDirectory = require('require-directory');
var _ = require("lodash");

var db = null;

var visitor = function visitor(obj) {
    return (/^Abstract/.test(obj.name) && obj.setDatabase && _.isFunction(obj.setDatabase) ? obj.setDatabase(db) : obj
    );
};

module.exports = function (db_ref) {
    db = db_ref;
    return requireDirectory(module, {
        visit: visitor
    });
};
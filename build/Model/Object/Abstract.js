'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Promise = require("bluebird");
var _ = require("lodash");

var bucket = false;

var Abstract = (function () {

    //selector_data - db_id or selector data
    //selector - selector name
    //cases : new Example("example/1") == new Example(1) == new Example({type: example, id: 1}, "Default")

    function Abstract() {
        _classCallCheck(this, Abstract);

        if (!bucket) throw new Error("Database is not settled.");

        this.db = bucket; //should be already initialized
        this.db_value = false; //no scheme for abstract
        this.cas = false; //still unknown but probably existing

        //no db loading in constructor
        return this;
    }

    _createClass(Abstract, [{
        key: "setSelector",

        //selector name and params {db: db_id, compose_data: {...}}. Specify either db or compose data for selector. Db is priority.
        value: function setSelector() {
            var Selector = require(__dirname + "/Selector/Abstract");
            this._selector = Selector;
        }
    }, {
        key: "getFromDatabase",
        value: function getFromDatabase() {
            throw new Error("Abstract method.");
        }
    }, {
        key: "getAndLock",
        value: function getAndLock() {
            throw new Error("Abstract method.");
        }
    }, {
        key: "getAndTouch",
        value: function getAndTouch() {
            throw new Error("Abstract method.");
        }
    }, {
        key: "unlock",
        value: function unlock() {
            throw new Error("Abstract method.");
        }
    }, {
        key: "insert",
        value: function insert() {
            throw new Error("Abstract method.");
        }
    }, {
        key: "upsert",
        value: function upsert() {
            throw new Error("Abstract method.");
        }
    }, {
        key: "remove",
        value: function remove() {
            throw new Error("Abstract method.");
        }

        //without cas
    }, {
        key: "removeUnsafe",
        value: function removeUnsafe() {
            throw new Error("Abstract method.");
        }
    }], [{
        key: "setDatabase",
        value: function setDatabase(db) {
            bucket = db;
        }
    }]);

    return Abstract;
})();

module.exports = Abstract;
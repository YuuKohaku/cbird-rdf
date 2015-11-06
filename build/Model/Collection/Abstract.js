'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require("lodash");
var bucket = false;
var Promise = require("bluebird");
var ModelObject = require("../Object/Abstract");
var DefaultSelector = require("../Object/Selector/Default");

var AbstractCollection = (function () {
    function AbstractCollection() {
        _classCallCheck(this, AbstractCollection);

        this.collection = {}; //[{key: el/1, value: {}}]
        if (!bucket) throw new Error("Database is not settled.");
        this.db = bucket;
    }

    _createClass(AbstractCollection, [{
        key: "loadFromDatabase",

        //when loading, search for type in Model.Object; if not found, create default object (Abstract)
        //so strange
        value: function loadFromDatabase() {
            var _this = this;

            var promises = _.map(this.keys, function (key) {
                var ob_key = key;
                var obj = false;
                if (_.isObject(key)) {
                    if (!key.selector || !key.id) throw new Error("Specify key object as {id: 'example/1', selector: 'Example'}");
                    var Selector = ModelObject.Selector[_.capitalize(key.selector)];
                    ob_key = key.id;
                    if (!Selector) throw new Error("Specified selector not found.");
                    var type = Selector.decompose(ob_key).type;
                    var obj_class = ModelObject[_.capitalize(type)] || ModelObject.Abstract;
                    console.log("Creating object of type ", type, " with selector ", key.selector);
                    obj = new obj_class(ob_key, key.selector);
                } else {
                    var type = DefaultSelector.decompose(key).type;
                    console.log("Creating object of type ", type);
                    var obj_class = ModelObject[_.capitalize(type)];
                    if (!obj_class) {
                        obj = new ModelObject.Basic(ob_key, type);
                    } else {
                        obj = new obj_class(ob_key);
                    }
                }
                return obj.getFromDatabase().then(function () {
                    _this.collection[ob_key] = obj;
                });
            });

            return Promise.all(promises);
        }
    }, {
        key: "toArray",
        value: function toArray() {
            return _.values(this.collection);
        }
    }, {
        key: "toMap",
        value: function toMap() {
            return this.collection;
        }
    }, {
        key: Symbol.iterator,
        value: function value() {
            var cur = 0;
            var arr = this.toArray();
            var len = arr.length;
            return {
                next: function next() {
                    var done = cur == len;
                    cur++;
                    return {
                        done: done,
                        value: arr[cur - 1]
                    };
                }
            };
        }
    }], [{
        key: "setDatabase",
        value: function setDatabase(db) {
            bucket = db;
        }
    }]);

    return AbstractCollection;
})();

module.exports = AbstractCollection;
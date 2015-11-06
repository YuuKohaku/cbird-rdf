'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Promise = require("bluebird");
var _ = require("lodash");
var Abstract = require("./Abstract");

var Basic = (function (_Abstract) {
    _inherits(Basic, _Abstract);

    //selector_data - db_id or selector data
    //selector - selector name
    //cases : new Example("example/1") == new Example(1) == new Example({type: example, id: 1}, "Default")

    function Basic(selector_data, selector) {
        _classCallCheck(this, Basic);

        //selector name - specified or the same as class name
        _get(Object.getPrototypeOf(Basic.prototype), "constructor", this).call(this);

        var sel = _.capitalize(selector) || this.constructor.name;
        var sel_data = {};
        var db_id = false;

        if (!selector_data || !_.isNumber(selector_data) && !_.isObject(selector_data) && !_.isString(selector_data)) throw new Error("Incorrect selector data.");

        if (_.isNumber(selector_data)) {
            //number will be passed as id
            sel_data.type = _.snakeCase(this.constructor.name);
            sel_data.id = selector_data;
        } else if (_.isObject(selector_data)) {
            sel_data = selector_data;
        } else {
            db_id = selector_data;
        }

        //sets selector object, database selector(db_id), type and id for this
        this.setSelector(sel, {
            db: db_id,
            compose_data: sel_data
        });

        //no db loading in constructor
        return this;
    }

    //selector name and params {db: db_id, compose_data: {...}}. Specify either db or compose data for selector. Db is priority.

    _createClass(Basic, [{
        key: "setSelector",
        value: function setSelector(name, opts) {
            if (!name) throw new Error("Not enough arguments to set the selector.");

            var params = opts || {};
            var Selector = false;
            try {
                Selector = require(__dirname + "/Selector/" + name);
            } catch (e) {
                Selector = require(__dirname + "/Selector/Default");
            }

            var selector = params.db || params.compose_data && Selector.compose(params.compose_data) || this.selector;
            var compose_data = Selector.decompose(selector);
            console.log("Setting selector", name, params, selector);

            this._selector = Selector;
            Object.defineProperties(this, {
                "_selector": {
                    value: Selector,
                    configurable: false,
                    writable: true,
                    enumerable: false
                },
                "selector": {
                    value: selector,
                    configurable: true,
                    writable: false,
                    enumerable: true
                },
                "type": {
                    value: compose_data.type,
                    configurable: true,
                    writable: false,
                    enumerable: true
                }
            });
        }
    }, {
        key: "getFromDatabase",
        value: function getFromDatabase() {
            var _this = this;

            console.log("Get from db:", this.selector, this.type);
            return this.db.get(this.selector).then(function (res) {
                //return from db
                //                console.log("Got this from db:", res);
                _this.cas = res.cas;
                if (!_this.db_value) _this.db_value = {};
                //TODO: Transform from RDF here
                _.merge(_this.db_value, res.value);
                return Promise.resolve(_this);
            })["catch"](function (err) {
                console.log('Could not get from db: ', err);
                return Promise.resolve(_this);
            });
        }
    }, {
        key: "getAndLock",
        value: function getAndLock(time) {
            var _this2 = this;

            var opts = {};
            if (time) opts.lockTime = time;

            return this.db.getAndLock(this.selector, opts).then(function (res) {
                //return from db
                _this2.cas = res.cas;
                _.merge(_this2.db_value, res.value);
                return Promise.resolve(_this2);
            })["catch"](function (err) {
                console.log('Could not get and lock: ', err);
                return Promise.resolve(_this2);
            });
        }
    }, {
        key: "getAndTouch",
        value: function getAndTouch(expiry) {
            var _this3 = this;

            return this.db.getAndTouch(this.selector, expiry).then(function (res) {
                //return from db
                _this3.cas = res.cas;
                _.merge(_this3.db_value, res.value);
                return Promise.resolve(_this3);
            })["catch"](function (err) {
                console.log('Could not get and lock: ', err);
                return Promise.resolve(_this3);
            });
        }
    }, {
        key: "unlock",
        value: function unlock() {
            var _this4 = this;

            return this.db.unlock(this.selector, this.cas).then(function () {
                //return from db
                return Promise.resolve(_this4);
            })["catch"](function (err) {
                console.log('Could not unlock: ', err.stack);
                return Promise.resolve(_this4);
            });
        }
    }, {
        key: "insert",
        value: function insert(data) {
            var _this5 = this;

            if (data) _.merge(this.db_value, data);

            //        console.log("INSERT", this.db_value);
            return this.db.insert(this.selector, this.db_value).then(function (res) {
                //return from db
                _this5.cas = res.cas;
                return Promise.resolve(_this5);
            });
        }
    }, {
        key: "upsert",
        value: function upsert(data) {
            var _this6 = this;

            if (data) _.merge(this.db_value, data);

            var opts = this.cas ? {
                cas: this.cas
            } : {};

            return this.db.upsert(this.selector, this.db_value, opts).then(function (res) {
                //return from db
                _this6.cas = res.cas;
                return Promise.resolve(_this6);
            });
        }
    }, {
        key: "remove",
        value: function remove() {
            var _this7 = this;

            return this.db.remove(this.selector, {
                cas: this.cas
            }).then(function (res) {
                _this7.cas = res.cas;
                _this7.db_value = false;
                return Promise.resolve(_this7);
            })["catch"](function (err) {
                console.log('Could not remove from db: ', err);
                return Promise.resolve(_this7);
            });
        }

        //without cas
    }, {
        key: "removeUnsafe",
        value: function removeUnsafe() {
            var _this8 = this;

            return this.db.remove(this.selector).then(function (res) {
                _this8.cas = res.cas;
                _this8.db_value = false;
                return Promise.resolve(_this8);
            })["catch"](function (err) {
                console.log('Could not remove from db: ', err);
                return Promise.resolve(_this8);
            });
        }
    }]);

    return Basic;
})(Abstract);

module.exports = Basic;
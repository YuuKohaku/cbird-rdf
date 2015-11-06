'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require("lodash");
var Promise = require("bluebird");
var Couchbird = require("Couchbird")();
var Basic = require("./Basic");

var ViewCollection = (function (_Basic) {
    _inherits(ViewCollection, _Basic);

    function ViewCollection(params) {
        _classCallCheck(this, ViewCollection);

        _get(Object.getPrototypeOf(ViewCollection.prototype), "constructor", this).call(this, params);
        this.view = {
            from: {
                ddoc: 'object',
                name: false
            },
            limit: false,
            offset: false,
            id_range: {
                start: undefined,
                end: undefined
            },
            keys: false,
            key: false,
            stale: false,
            group: false,
            range: {
                start: undefined,
                end: undefined,
                inclusive_end: true
            },
            order: false
        };
        _.merge(this.view, params);
    }

    //when loading, search for type in Model.Object; if not found, create default object (Abstract)
    //so strange

    _createClass(ViewCollection, [{
        key: "loadFromDatabase",
        value: function loadFromDatabase() {
            var _this = this;

            var vq = Couchbird.ViewQuery.from(this.view.from.ddoc, this.view.from.name).range(this.view.range.start, this.view.range.end, this.view.range.inclusive_end);
            if (this.view.id_range.start || this.view.id_range.end) vq.id_range(this.view.id_range.start, this.view.id_range.end);
            if (this.view.limit) vq.limit(this.limit);
            if (this.view.offset) vq.skip(this.offset);
            if (this.view.key) vq.key(this.view.key);
            if (this.view.keys) vq.keys(this.view.keys);
            if (this.view.stale) vq.stale(this.view.stale);
            if (this.view.order) vq.order(this.view.order);
            if (this.view.group) vq.group(this.view.group);

            return this.db.view(vq).then(function (res) {
                var data = res;
                _this.keys = _.pluck(data, 'id');
                //                console.log("Got keys", this.keys);
                return _get(Object.getPrototypeOf(ViewCollection.prototype), "loadFromDatabase", _this).call(_this);
            });
        }
    }]);

    return ViewCollection;
})(Basic);

module.exports = ViewCollection;
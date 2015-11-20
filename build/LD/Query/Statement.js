'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('lodash');
var Abstract = require('./Abstract');
var ViewQuery = require("Couchbird").ViewQuery;
var Promise = require("bluebird");

function invertCharCase(ch) {
	var tmp = ch.toUpperCase();
	if (tmp === ch) {
		return ch.toLowerCase();
	}
	return tmp;
}

var JsonLDViewQuery = (function (_Abstract) {
	_inherits(JsonLDViewQuery, _Abstract);

	function JsonLDViewQuery() {
		_classCallCheck(this, JsonLDViewQuery);

		_get(Object.getPrototypeOf(JsonLDViewQuery.prototype), 'constructor', this).apply(this, arguments);
	}

	_createClass(JsonLDViewQuery, [{
		key: 'bySubject',
		value: function bySubject(subject) {
			var keys = _.isArray(subject) ? subject : [subject];
			var query = ViewQuery.from(this._db.bucket_name, "jsonld-subject").keys(keys).custom({
				inclusive_end: true
			}).reduce(true).group(true);

			return this._db.view(query).then(function (res) {
				return _.reduce(res, function (acc, val) {
					acc[val.key] = val.value;
					return acc;
				}, {});
			});
		}
	}, {
		key: 'byPredicate',
		value: function byPredicate(subject) {
			var keys = _.isArray(subject) ? subject : [subject];
			var query = ViewQuery.from(this._db.bucket_name, "jsonld-predicate").keys(keys).custom({
				inclusive_end: true
			}).reduce(true).group(true);

			return this._db.view(query).then(function (res) {
				return _.reduce(res, function (acc, val) {
					acc[val.key] = val.value;
					return acc;
				}, {});
			});
		}
	}, {
		key: 'byObject',
		value: function byObject(subject) {
			var keys = _.isArray(subject) ? subject : [subject];
			var query = ViewQuery.from(this._db.bucket_name, "jsonld-object").keys(keys).custom({
				inclusive_end: true
			}).reduce(true).group(true);

			return this._db.view(query).then(function (res) {
				return _.reduce(res, function (acc, val) {
					acc[val.key] = val.value;
					return acc;
				}, {});
			});
		}
	}, {
		key: 'byTriple',
		value: function byTriple(_ref) {
			var _ref$subject = _ref.subject;
			var s = _ref$subject === undefined ? null : _ref$subject;
			var _ref$predicate = _ref.predicate;
			var p = _ref$predicate === undefined ? null : _ref$predicate;
			var _ref$object = _ref.object;
			var o = _ref$object === undefined ? null : _ref$object;

			if (s && !_.isString(s) || p && !_.isString(p) || o && !_.isString(o)) {
				return Promise.reject(new Error("All passed values must be strings."));
			}

			if (!s && !p && !o) {
				return Promise.resolve([]);
			}

			if (s && !p && o) {
				return this.bySubject(s).then(function (res) {
					var data = _.filter(res[s], function (val) {
						return _.eq(val.object.value, o);
					});
					return Promise.resolve(data);
				});
			}
			if (!s && p && !o) {
				return this.byPredicate(p).then(function (res) {
					return Promise.resolve(res[p]);
				});
			}
			if (!s && p && o) {
				return this.byPredicate(p).then(function (res) {
					var data = _.filter(res[p], function (val) {
						return _.eq(val.object.value, o);
					});
					return Promise.resolve(data);
				});
			}
			if (!s && !p && o) {
				return this.byObject(o).then(function (res) {
					return Promise.resolve(res[o]);
				});
			}
			if (s && !p && !o) {
				return this.bySubject(s).then(function (res) {
					return Promise.resolve(res[s]);
				});
			}

			var query = ViewQuery.from(this._db.bucket_name, "jsonld").reduce(true).custom({
				inclusive_end: true
			});
			var end = null;
			var endkey = "";

			if (s && p && !o) {
				// couchbase magic
				end = p.charCodeAt(p.length - 1);
				end++;
				endkey = p.slice(0, p.length - 1) + invertCharCase(String.fromCharCode(end));

				query.group_level(2).range([s, p], [s, endkey], true);
			}
			if (s && p && o) {
				// couchbase magic
				end = o.charCodeAt(o.length - 1);
				end++;
				endkey = o.slice(0, o.length - 1) + invertCharCase(String.fromCharCode(end));

				query.group_level(3).range([s, p, o], [s, p, o], true);
			}
			return this._db.view(query).then(function (res) {
				return _.flatten(_.map(res, function (val) {
					return val.value;
				}));
			});
		}
	}]);

	return JsonLDViewQuery;
})(Abstract);

module.exports = JsonLDViewQuery;
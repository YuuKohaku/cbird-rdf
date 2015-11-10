'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('lodash');
var Abstract = require('./Abstract');
var ViewQuery = require("Couchbird").ViewQuery;

var LDViewQuery = (function (_Abstract) {
	_inherits(LDViewQuery, _Abstract);

	function LDViewQuery() {
		_classCallCheck(this, LDViewQuery);

		_get(Object.getPrototypeOf(LDViewQuery.prototype), 'constructor', this).apply(this, arguments);
	}

	_createClass(LDViewQuery, [{
		key: 'bySubject',
		value: function bySubject(subject) {
			var keys = _.isArray(subject) ? subject : [subject];
			var query = ViewQuery.from(this._db.bucket_name, "subject").keys(keys).custom({
				inclusive_end: true
			}).include_docs(true);
			return this._db.view(query).then(function (res) {
				return _.reduce(res, function (acc, val) {
					acc[val.key] = val.doc;
					return acc;
				}, {});
			});
		}
	}, {
		key: 'byPredicate',
		value: function byPredicate(subject) {
			var keys = _.isArray(subject) ? subject : [subject];
			var query = ViewQuery.from(this._db.bucket_name, "predicate").keys(keys).custom({
				inclusive_end: true
			}).include_docs(true);
			return this._db.view(query).then(function (res) {
				return _.reduce(res, function (acc, val) {
					acc[val.key] = val.doc;
					return acc;
				}, {});
			});
		}
	}, {
		key: 'byObject',
		value: function byObject(subject) {
			var keys = _.isArray(subject) ? subject : [subject];
			var query = ViewQuery.from(this._db.bucket_name, "object").keys(keys).custom({
				inclusive_end: true
			}).include_docs(true);
			return this._db.view(query).then(function (res) {
				return _.reduce(res, function (acc, val) {
					acc[val.key] = val.doc;
					return acc;
				}, {});
			});
		}
	}]);

	return LDViewQuery;
})(Abstract);

module.exports = LDViewQuery;
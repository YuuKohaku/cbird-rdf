'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('lodash');
var Abstract = require('./Abstract');
var N1qlQuery = require("Couchbird").N1qlQuery;
var Promise = require("bluebird");

var N1qlLDQuery = (function (_Abstract) {
	_inherits(N1qlLDQuery, _Abstract);

	function N1qlLDQuery() {
		_classCallCheck(this, N1qlLDQuery);

		_get(Object.getPrototypeOf(N1qlLDQuery.prototype), 'constructor', this).apply(this, arguments);
	}

	_createClass(N1qlLDQuery, [{
		key: 'bySubject',
		value: function bySubject(val) {
			return this.byTriple({
				subject: val,
				predicate: null,
				object: null
			});
		}
	}, {
		key: 'byPredicate',
		value: function byPredicate(val) {
			return this.byTriple({
				subject: null,
				predicate: val,
				object: null
			});
		}
	}, {
		key: 'byObject',
		value: function byObject(val) {
			return this.byTriple({
				subject: null,
				predicate: null,
				object: val
			});
		}
	}, {
		key: 'byTriple',
		value: function byTriple(_ref) {
			var _ref$select = _ref.select;
			var prop = _ref$select === undefined ? null : _ref$select;
			var _ref$subject = _ref.subject;
			var s = _ref$subject === undefined ? null : _ref$subject;
			var _ref$predicate = _ref.predicate;
			var p = _ref$predicate === undefined ? null : _ref$predicate;
			var _ref$object = _ref.object;
			var o = _ref$object === undefined ? null : _ref$object;

			if (!s && !p && !o) {
				return Promise.resolve([]);
			}
			if (s && !_.isString(s) || p && !_.isString(p) || o && !_.isString(o)) {
				return Promise.reject(new Error("All passed values must be strings."));
			}
			var sel = prop || "*";

			var qstr = "SELECT `" + sel + "` FROM `" + this._db.bucket_name + "` AS doc ";
			var params = [];
			if (s && !p && !o) {
				qstr += "USE KEYS $1";
				params = [[s]];
			}
			if (!s && p && !o) {
				//until they fix this bug with forward-slash escaping
				qstr += "WHERE $1 IN object_names(doc);";
				params = [p];
			}
			if (!s && !p && o) {
				qstr += "WHERE $1 WITHIN doc;";
				params = [o];
			}
			if (s && p && !o) {
				//until they fix this bug with forward-slash escaping
				qstr += "USE KEYS $1 WHERE $2 IN object_names(doc);";
				params = [[s], p];
			}
			if (s && !p && o) {
				qstr += "USE KEYS $1 WHERE $2 WITHIN doc;";
				params = [[s], o];
			}
			if (!s && p && o) {
				//INJECTION WARNING! Need to correct this later.
				qstr += "WHERE $1 WITHIN doc.`" + p + "`;";
				params = [o];
			}
			if (s && p && o) {
				//INJECTION WARNING! Need to correct this later.
				qstr += "USE KEYS $1 WHERE $2 WITHIN doc.`" + p + "`;";
				params = [[s], o];
			}
			var query = N1qlQuery.fromString(qstr);
			return this._db.N1QL(query, params).then(function (res) {
				return _.map(res, function (val) {
					return val.doc;
				});
			});
		}
	}]);

	return N1qlLDQuery;
})(Abstract);

module.exports = N1qlLDQuery;
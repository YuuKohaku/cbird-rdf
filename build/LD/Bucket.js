'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x3, _x4, _x5) { var _again = true; _function: while (_again) { var object = _x3, property = _x4, receiver = _x5; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x3 = parent; _x4 = property; _x5 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require("lodash");
var Promise = require("bluebird");
var jsonld = require("jsonld").promises;
var fs = Promise.promisifyAll(require("fs"));
var path = require("path");

var Couchbird = require("Couchbird");
var Bucket = Couchbird.Bucket;

var locate_ifaces = function locate_ifaces(names) {
	var result = {};
	if (!_.isArray(names)) return result;
	for (var i in names) {
		var iface = null;
		try {
			iface = require("./Query/" + names[i]);
			result[names[i]] = iface;
		} catch (e) {
			iface = null;
		}
	}
	return result;
};

var CBStorageBucket = (function (_Bucket) {
	_inherits(CBStorageBucket, _Bucket);

	function CBStorageBucket() {
		_classCallCheck(this, CBStorageBucket);

		for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
			args[_key] = arguments[_key];
		}

		_get(Object.getPrototypeOf(CBStorageBucket.prototype), "constructor", this).apply(this, args);
		this.assignQueryInterfaces(['View', 'Statement', 'N1ql']);
	}

	/////////////////////////////////vocabulary installation//////////////////////////

	_createClass(CBStorageBucket, [{
		key: "setVocabulary",
		value: function setVocabulary(_ref) {
			var _this = this;

			var domain_voc = _ref.domain;
			var basic_voc = _ref.basic;
			var from_fs = _ref.fs;

			if (!domain_voc || !basic_voc) return Promise.reject(new Error("Insufficient vocabulary information."));
			this.vocabulary = {
				basic: null,
				domain: null,
				context: null
			};
			if (!from_fs) {
				return Promise.props({
					domain: _get(Object.getPrototypeOf(CBStorageBucket.prototype), "get", this).call(this, domain_voc),
					basic: _get(Object.getPrototypeOf(CBStorageBucket.prototype), "get", this).call(this, basic_voc)
				}).then(function (res) {
					_this.vocabulary.basic = res.basic.value;
					_this.vocabulary.domain = res.domain.value;
					_this.vocabulary.context = _.merge(res.basic.value["@context"], res.domain.value["@context"]);
					return Promise.resolve(_this);
				});
			} else {
				return Promise.props({
					domain: fs.readFileAsync(domain_voc).then(JSON.parse),
					basic: fs.readFileAsync(basic_voc).then(JSON.parse)
				}).then(function (res) {
					_this.vocabulary.basic = res.basic;
					_this.vocabulary.domain = res.domain;
					_this.vocabulary.context = _.merge(res.basic["@context"], res.domain["@context"]);
					return Promise.resolve(_this);
				})["catch"](SyntaxError, function (e) {
					return Promise.reject(new Error("Invalid json in vocabulary files: ", e.message));
				})["catch"](Promise.OperationalError, function (e) {
					return Promise.reject(new Error("Unable to read vocabulary file: ", e.message));
				});
			}
		}

		///////////////////////////Query/////////////////////////////////////////
	}, {
		key: "assignQueryInterfaces",
		value: function assignQueryInterfaces(names) {
			var _this2 = this;

			var result = locate_ifaces(names);
			_.assign(this, result, function (cur, query_class) {
				return new query_class(_this2);
			});
		}

		/////////////////////////mass nodes operations//////////////////////////////
		//nodes upsert
	}, {
		key: "upsertNodes",
		value: function upsertNodes(triples) {
			var _this3 = this;

			var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

			var promises = {};
			return jsonld.expand(triples).then(function (res) {
				_.map(res, function (val) {
					promises[val["@id"]] = _this3.upsert(val["@id"], val, options);
				});
				return Promise.props(promises);
			})["catch"](function (err) {
				return Promise.reject(new Error("Unable to store data: ", err.message));
			});
		}

		//replaces existing nodes with given ones
	}, {
		key: "replaceNodes",
		value: function replaceNodes(triples) {
			var _this4 = this;

			var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

			var promises = {};
			return jsonld.expand(triples).then(function (res) {
				_.map(res, function (val) {
					promises[val["@id"]] = _this4.replace(val["@id"], val, options)["catch"](function (err) {
						return Promise.resolve(false);
					});
				});
				return Promise.props(promises);
			})["catch"](function (err) {
				return Promise.reject(new Error("Unable to store data: ", err.message));
			});
		}
	}, {
		key: "getNodes",
		value: function getNodes(subjects) {
			var _this5 = this;

			var promises = {};
			var keys = _.isArray(subjects) ? subjects : [subjects];
			_.map(keys, function (key) {
				promises[key] = _this5.get(key)["catch"](function (err) {
					return Promise.resolve(undefined);
				});
			});
			return Promise.props(promises);
		}

		//!! possibly this will make other docs invalid because of non-existent node
	}, {
		key: "removeNodes",
		value: function removeNodes(subjects) {
			var _this6 = this;

			var keys = _.isArray(subjects) ? subjects : [subjects];
			var promises = {};
			_.map(keys, function (key) {
				promises[key] = _this6.remove(key)["catch"](function (err) {
					return Promise.resolve(false);
				});
			});
			return Promise.props(promises);
		}

		/////////////////////Views functions///////////////////////////
		//Views installation
		//default-views.json by default

	}, {
		key: "installViews",
		value: function installViews(filename) {
			var mgr = this.manager();
			var fname = _.isString(filename) ? filename : path.resolve(__dirname, "default/views.json");

			return fs.readFileAsync(fname).then(function (res) {
				var doc = JSON.parse(res);
				var promises = [];
				for (var i in doc) {
					promises.push(mgr.upsertDesignDocument(i, doc[i]));
				}
				return Promise.all(promises);
			})["catch"](function (err) {
				return Promise.reject(new Error("Unable to install views from ", fname));
			});
		}
	}, {
		key: "uninstallViews",
		value: function uninstallViews(names) {
			var mgr = this.manager();
			var keys = _.isArray(names) ? names : [names];
			var promises = [];

			for (var i in keys) {
				promises.push(mgr.removeDesignDocument(keys[i]));
			}
			return Promise.all(promises)["catch"](function (err) {
				return Promise.reject(new Error("Unable to uninstall views  ", names));
			});
		}
	}]);

	return CBStorageBucket;
})(Bucket);

module.exports = CBStorageBucket;
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LDBucketQuery = (function () {
	function LDBucketQuery(bucket) {
		_classCallCheck(this, LDBucketQuery);

		if (!bucket) throw new Error("Pass a valid bucket to initialize the interface.");
		this._db = bucket;
		return this;
	}

	_createClass(LDBucketQuery, [{
		key: "bySubject",
		value: function bySubject() {
			throw new Error("Abstract method.");
		}
	}, {
		key: "byPredicate",
		value: function byPredicate() {
			throw new Error("Abstract method.");
		}
	}, {
		key: "byObject",
		value: function byObject() {
			throw new Error("Abstract method.");
		}
	}, {
		key: "byTriple",
		value: function byTriple() {
			throw new Error("Abstract method.");
		}
	}]);

	return LDBucketQuery;
})();

module.exports = LDBucketQuery;
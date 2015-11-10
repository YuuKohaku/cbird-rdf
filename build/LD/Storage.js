'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Bucket = require('./Bucket');
var Couchbird = require("Couchbird");

var CBStorage = (function () {
    function CBStorage(config, reinit) {
        _classCallCheck(this, CBStorage);

        this.couchbird = Couchbird(config, reinit);
        return this;
    }

    _createClass(CBStorage, [{
        key: 'bucket',
        value: function bucket(bname) {
            if (!this.couchbird) throw new Error("Database is not connected");
            return this.couchbird.bucket(bname, Bucket);
        }
    }]);

    return CBStorage;
})();

module.exports = CBStorage;
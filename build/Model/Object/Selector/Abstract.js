'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AbstractSelector = (function () {
    function AbstractSelector() {
        _classCallCheck(this, AbstractSelector);
    }

    _createClass(AbstractSelector, null, [{
        key: "compose",
        value: function compose() {
            throw new Error("Abstract method.");
        }
    }, {
        key: "decompose",
        value: function decompose() {
            throw new Error("Abstract method.");
        }
    }]);

    return AbstractSelector;
})();

module.exports = AbstractSelector;
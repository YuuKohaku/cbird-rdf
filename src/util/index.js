let requireDirectory = require('require-directory');

module.exports = function (db_ref) {
    db = db_ref;
    return requireDirectory(module);
}
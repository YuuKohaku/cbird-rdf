let jsonld = require("jsonld");
let Promise = require("bluebird");
let fs = Promise.promisifyAll(require("fs"));
let path = require("path");

let ps = jsonld.promises;

module.exports = function (cb, fname) {
    let manager = cb.manager();

    return fs.readFileAsync(fname)
        .then((res) => {
            let doc = JSON.parse(res);
            let promises = [];
            for (var i in doc) {
                promises.push(manager.upsertDesignDocument(i, doc[i]));
            }
            return Promise.all(promises);
        });
}
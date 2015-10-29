let jsonld = require("jsonld");
let Promise = require("bluebird");
let fs = Promise.promisifyAll(require("fs"));
let path = require("path");

let ps = jsonld.promises;

module.exports = function (cb, fname) {
    let manager = cb.manager();

    manager.getDesignDocuments()
        .then((res) => {
            console.log(res);
            return fs.writeFileAsync(fname, JSON.stringify(res, null, 4));
        })
}
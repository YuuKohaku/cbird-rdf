let jsonld = require("jsonld");
let Promise = require("bluebird");
let fs = Promise.promisifyAll(require("fs"));
let path = require("path");

let ps = jsonld.promises;

module.exports = function (fname) {
    let p = path.parse(fname);
    p.name += "_expanded";
    p.base = p.name + p.ext;
    let fin = path.format(p);

    return fs.readFileAsync(fname)
        .then((res) => {
            return ps.expand(JSON.parse(res));
        })
        .then((res) => {
            return fs.writeFileAsync(fin, JSON.stringify(res, null, 4));
        });

}
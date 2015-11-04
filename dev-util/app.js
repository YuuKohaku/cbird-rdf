'use strict'

let Couchbird = require("Couchbird")({
    server_ip: "127.0.0.1",
    n1ql: "127.0.0.1:8093"
}).bucket("rdf");

let triples = require("../test/data.json");
let extriples = require("../test/data_expanded.json");
let jsonld = require("jsonld");
let Promise = require("bluebird");
let fs = Promise.promisifyAll(require("fs"));
let _ = require("lodash");

let RDFcb = require("../build");
console.log(RDFcb);

let ps = jsonld.promises;
let expand = require("./utils/expand");
let getviews = require("./utils/get-views");
let setviews = require("./utils/set-views");
let jld = require("./utils/jsonld");

//expand("./test/data.json");
//getviews(Couchbird, "./examples/output/out.json");
//setviews(Couchbird, "./examples/output/out.json");


//jld.toRDF(extriples[6], function (err, res) {
//    console.log(res["@default"])
//})
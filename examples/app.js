'use strict'

let Couchbird = require("Couchbird")({
    server_ip: "127.0.0.1",
    n1ql: "127.0.0.1:8093"
}).bucket("rdf");

let triples = require("../test/data.json");
let jsonld = require("jsonld");
let Promise = require("bluebird");
let fs = Promise.promisifyAll(require("fs"));

let ps = jsonld.promises;
let expand = require("../test/utils/expand");

expand("./test/data.json");
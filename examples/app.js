'use strict'

let Couchbird = require("Couchbird")({
    server_ip: "127.0.0.1",
    n1ql: "127.0.0.1:8093"
}).bucket("rdf");

var model = require("./core/Model")(Couchbird);

console.log("----------------------------------------------------------------------------------------");
console.log(model);
'use strict'

let Couchbird = require("Couchbird")({
	server_ip: "127.0.0.1",
	n1ql: "127.0.0.1:8093"
}).bucket("rdf");
let jsonld = require("jsonld");
let Promise = require("bluebird");
let fs = Promise.promisifyAll(require("fs"));
let _ = require("lodash");

let RDFcb = require("..").LD;

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

let base = "iris://data#plan";
let cb = new RDFcb({
	server_ip: "127.0.0.1",
	n1ql: "127.0.0.1:8093"
});
let bucket = cb.bucket("rdf");
let nodes = {};

for (var i = 0; i < 1000; i++) {
	let node = {
		"@id": undefined,
		"@type": "iris://vocabulary/domain#Plan",
		"iris://vocabulary/domain#hasPlanDescription": JSON.stringify([[10, 20], [30, 50]])
	};
	nodes[base + i] = _.assign(_.cloneDeep(node), {
		"@id": base + i
	});
}

bucket.upsertNodes(_.values(nodes))
	.then((res) => {
		console.log(res);
	})
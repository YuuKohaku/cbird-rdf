'use strict'
var chai = require('chai'),
	expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

var Couchbird = require("Couchbird");
var path = require("path");
var _ = require("lodash");
var ps = require("jsonld").promises;
var RDFcb = require("../build").LD;

var cfg = require("./config/config.json");

var db = new RDFcb();
var bucket = db.bucket(cfg.bucket);;
bucket.enableN1ql();

describe('Performance comparison', function() {
	this.slow(0);
	let base = "iris://data#plan";
	let nodes = {};

	for(var i = 0; i < 1000; i++) {
		let node = {
			"@id": undefined,
			"@type": "iris://vocabulary/domain#Plan",
			"iris://vocabulary/domain#hasPlanDescription": JSON.stringify([
				[10, 20],
				[30, 50]
			])
		};
		nodes[base + i] = _.assign(_.cloneDeep(node), {
			"@id": base + i
		});
	}
	before(function() {
		return bucket.N1QL(Couchbird.N1qlQuery.fromString("CREATE PRIMARY INDEX ON " + cfg.bucket + ";")).then(function(res) {
			return Promise.all([bucket.upsertNodes(_.values(nodes)), bucket.upsert(base, nodes)]);
		})
	});

	after(function() {
		// return Promise.all([bucket.removeNodes(_.keys(nodes)), bucket.remove(base)]);
	});
	describe('Get single-doc plans', function() {
		it('should get plans doc', function(done) {
			bucket.get(base)
				.then(function(res) {
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
	});
	describe('Get multi-doc plans', function() {
		it('should get plan docs by N1ql', function(done) {
			bucket.N1ql.byTriple({
					predicate: '@type',
					object: "iris://vocabulary/domain#Plan"
				})
				.then(function(res) {
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
		it('should get plan docs by LDStatement View', function(done) {
			bucket.Statement.byTriple({
					predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
					object: "iris://vocabulary/domain#Plan"
				})
				.then(function(res) {
					return bucket.getNodes(_.pluck(res, 'subject.value'));
				})
				.then(function(res) {
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
	});
});
'use strict'
var chai = require('chai'),
	expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

var Couchbird = require("Couchbird");
var path = require("path");
var _ = require("lodash");
var ps = require("jsonld").promises;
var RDFcb = require("../build/index").LD;

var cfg = require("./config/config.json");

var db = new RDFcb(cfg.couchbird);
var bucket = db.bucket(cfg.bucket);;
bucket.enableN1ql();
var mgr = bucket.manager();

describe('N1QL', function() {
	this.timeout(10000);
	var rabbit = {
		"@id": "http://wonderland#whiterabbit",
		"@type": ["http://wonderland#Rabbit"],
		'http://wonderland#color': [{
			"@id": "http://wonderland#white"
		}]
	};
	var mouse = {
		"@id": "http://wonderland#sleepymouse",
		"@type": ["http://wonderland#Mouse"],
		'http://wonderland#name': [{
			"@value": "Sonja"
		}]
	};
	var rdfmouse = false;
	before(function() {
		return ps.toRDF(mouse)
			.then(function(res) {
				rdfmouse = res["@default"];
				return bucket.N1QL(Couchbird.N1qlQuery.fromString("CREATE PRIMARY INDEX ON " + cfg.bucket + ";"))
			});
	});
	beforeEach(function() {
		return bucket.upsertNodes([rabbit, mouse]);
	});
	describe('##N1ql.bySubject', function() {
		it('should return corresponding docs', function(done) {
			var p = bucket.N1ql.bySubject(rabbit["@id"])
				.then(function(res) {
					expect(res).to.deep.include(rabbit);
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
	});
	describe('##N1ql.byPredicate', function() {
		it('should return corresponding docs', function(done) {
			var p = bucket.N1ql.byPredicate('http://wonderland#color')
				.then(function(res) {
					expect(res).to.deep.include(rabbit);
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
	});
	describe('##N1ql.byObject', function() {
		it('should return corresponding docs', function(done) {
			var p = bucket.N1ql.byObject('http://wonderland#white')
				.then(function(res) {
					expect(res).to.deep.include(rabbit);
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
	});
	describe('##N1ql.byTriple {s p ?o}', function() {
		it('should return corresponding docs', function(done) {
			var p = bucket.N1ql.byTriple({
					subject: rabbit["@id"],
					predicate: 'http://wonderland#color',
					object: false
				})
				.then(function(res) {
					expect(res).to.deep.include(rabbit);
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
	});
	describe('##N1ql.byTriple {s ?p o}', function() {
		it('should return corresponding docs', function(done) {
			var p = bucket.N1ql.byTriple({
					subject: rabbit["@id"],
					predicate: false,
					object: 'http://wonderland#white'
				})
				.then(function(res) {
					expect(res).to.deep.include(rabbit);
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
	});
	describe('##N1ql.byTriple {?s p o}', function() {
		it('should return corresponding docs', function(done) {
			var p = bucket.N1ql.byTriple({
					subject: false,
					predicate: '@type',
					object: "http://wonderland#Rabbit"
				})
				.then(function(res) {
					expect(res).to.deep.include(rabbit);
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
	});
	describe('##N1ql.byTriple {s p o}', function() {
		it('should return corresponding docs', function(done) {
			var p = bucket.N1ql.byTriple({
					subject: rabbit["@id"],
					predicate: '@type',
					object: "http://wonderland#Rabbit"
				})
				.then(function(res) {
					expect(res).to.deep.include(rabbit);
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
	});
	describe('##N1ql.byTriple {?s ?p ?o}', function() {
		it('should return an empty array', function(done) {
			var p = bucket.N1ql.byTriple({
					subject: false,
					predicate: false,
					object: false
				})
				.then(function(res) {
					expect(res).to.be.instanceof(Array).and.to.be.empty;
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
	});
	describe('##N1ql.byTriple {? ? ?}', function() {
		it('should throw an error', function(done) {
			var p = bucket.N1ql.byTriple({
					subject: ["wow"],
					predicate: false,
					object: false
				})
				.then(function(res) {
					done(new Error("Incorrect response"));
				})
				.catch(function(err) {
					if(!/All passed values must be strings/.test(err.message))
						done(new Error("Incorrect behaviour"));
					done();
				});
		});
	});
});
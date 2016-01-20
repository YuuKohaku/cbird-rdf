'use strict'
var chai = require('chai'),
	expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

var path = require("path");
var _ = require("lodash");
var ps = require("jsonld").promises;
var RDFcb = require("../build/index").LD;

var cfg = require("./config/config.json");
var triples = require("./data/data.json");
var extriples = require("./data/data_expanded.json");
var testviews = require("./config/views.json");
var defviews = require("../build/LD/default/views.json");

var db = new RDFcb();
var bucket = db.bucket(cfg.bucket);;
var mgr = bucket.manager();

describe.only('Views', function() {
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
		return ps.toRDF(mouse).then(function(res) {
			rdfmouse = res["@default"];
		});
	});
	beforeEach(function() {
		return bucket.upsertNodes([rabbit, mouse]);
	});
	describe('#installViews', function() {
		it('should upsert default views', function(done) {
			var p = bucket.installViews()
				.then(function(res) {
					return mgr.getDesignDocuments();
				})
				.then(function(res) {
					for(var i in defviews) {
						if(!_.isEqual(res[i], defviews[i])) throw new Error("Incorrect value");
					}
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
		it('should upsert views', function(done) {
			var p = bucket.installViews(path.resolve(__dirname, "./config/views.json"))
				.then(function(res) {
					return mgr.getDesignDocuments();
				})
				.then(function(res) {
					for(var i in testviews) {
						if(!_.isEqual(res[i], testviews[i])) throw new Error("Incorrect value");
					}
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
	});
	describe('#uninstallViews', function() {
		it('should remove views', function(done) {
			var p = bucket.uninstallViews(_.keys(testviews))
				.then(function(res) {
					return mgr.getDesignDocuments();
				})
				.then(function(res) {
					for(var i in testviews) {
						if(res[i]) done(new Error("Incorrect value"));
					}
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
	});
	describe('##View.bySubject', function() {
		it('should get corresponding docs', function(done) {
			var p = bucket.View.bySubject(rabbit["@id"])
				.then(function(res) {
					expect(res).to.have.property(rabbit["@id"]).which.is.eql(rabbit);
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
	});
	describe('##View.byObject', function() {
		it('should get corresponding docs', function(done) {
			var p = bucket.View.byObject("http://wonderland#white")
				.then(function(res) {
					expect(res).to.have.property("http://wonderland#white").which.is.eql(rabbit);
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
	});
	describe('##View.byPredicate', function() {
		it('should get corresponding docs', function(done) {
			var p = bucket.View.byPredicate('http://wonderland#color')
				.then(function(res) {
					expect(res).to.have.property('http://wonderland#color').which.is.eql(rabbit);
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
	});
	describe('##Statement.bySubject', function() {
		it('should get corresponding docs', function(done) {
			var p = bucket.Statement.bySubject([mouse["@id"], rabbit["@id"]])
				.then(function(res) {
					expect(res).to.have.property(mouse["@id"]).which.deep.include.members(rdfmouse);
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
	});
	describe('##Statement.byPredicate', function() {
		it('should get corresponding docs', function(done) {
			var p = bucket.Statement.byPredicate('http://wonderland#name')
				.then(function(res) {
					expect(res).to.have.deep.property("http://wonderland#name" + "[0]");
					expect(rdfmouse).to.deep.include(res['http://wonderland#name'][0]);
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
	});
	describe('##Statement.byObject', function() {
		it('should get corresponding docs', function(done) {
			var p = bucket.Statement.byObject('http://wonderland#Mouse')
				.then(function(res) {
					expect(res).to.have.deep.property("http://wonderland#Mouse" + "[0]");
					expect(rdfmouse).to.deep.include(res['http://wonderland#Mouse'][0]);
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
	});
	describe('##Statement.byTriple {?s ?p ?o})', function() {
		it('should return an empty array', function(done) {
			var p = bucket.Statement.byTriple({})
				.then(function(res) {
					expect(res).to.be.instanceof(Array).and.to.be.empty;
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
	});
	describe('##Statement.byTriple {s ?p ?o})', function() {
		it('should get corresponding docs', function(done) {
			var p = bucket.Statement.byTriple({
					subject: mouse["@id"]
				})
				.then(function(res) {
					expect(res).to.be.not.empty;
					expect(res).to.deep.include.members(rdfmouse);
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
	});
	describe('##Statement.byTriple {?s p ?o})', function() {
		it('should get corresponding docs', function(done) {
			var p = bucket.Statement.byTriple({
					predicate: 'http://wonderland#name'
				})
				.then(function(res) {
					expect(res).to.be.not.empty;
					expect(rdfmouse).to.deep.include.members(res);
					for(var i in res) {
						expect(res[i].predicate.value).to.equal('http://wonderland#name');
					}
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
	});
	describe('##Statement.byTriple {?s ?p o})', function() {
		it('should get corresponding docs', function(done) {
			var p = bucket.Statement.byTriple({
					object: 'http://wonderland#Mouse'
				})
				.then(function(res) {
					expect(res).to.be.not.empty;
					expect(rdfmouse).to.deep.include.members(res);
					for(var i in res) {
						expect(res[i].object.value).to.equal('http://wonderland#Mouse');
					}
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
	});
	describe('##Statement.byTriple {s ?p o})', function() {
		it('should get corresponding docs', function(done) {
			var p = bucket.Statement.byTriple({
					subject: mouse["@id"],
					object: 'http://wonderland#Mouse'
				})
				.then(function(res) {
					expect(res).to.be.not.empty;
					expect(rdfmouse).to.deep.include.members(res);
					for(var i in res) {
						expect(res[i].subject.value).to.equal(mouse["@id"]);
						expect(res[i].object.value).to.equal('http://wonderland#Mouse');
					}
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
	});
	describe('##Statement.byTriple {?s p o})', function() {
		it('should get corresponding docs', function(done) {
			var p = bucket.Statement.byTriple({
					predicate: 'http://wonderland#name',
					object: 'Sonja'
				})
				.then(function(res) {
					expect(res).to.be.not.empty;
					expect(rdfmouse).to.deep.include.members(res);
					for(var i in res) {
						expect(res[i].predicate.value).to.equal('http://wonderland#name');
						expect(res[i].object.value).to.equal('Sonja');
					}
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
	});
	describe('##Statement.byTriple {s p ?o})', function() {
		it('should get corresponding docs', function(done) {
			var p = bucket.Statement.byTriple({
					subject: mouse["@id"],
					predicate: 'http://wonderland#name'
				})
				.then(function(res) {
					expect(res).to.be.not.empty;
					expect(rdfmouse).to.deep.include.members(res);
					for(var i in res) {
						expect(res[i].predicate.value).to.equal('http://wonderland#name');
						expect(res[i].subject.value).to.equal(mouse["@id"]);
					}
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
	});
	describe('##Statement.byTriple {s p o})', function() {
		it('should get corresponding docs', function(done) {
			var p = bucket.Statement.byTriple({
					subject: mouse["@id"],
					predicate: 'http://wonderland#name',
					object: 'Sonja'
				})
				.then(function(res) {
					expect(res).to.be.not.empty;
					expect(rdfmouse).to.deep.include.members(res);
					for(var i in res) {
						expect(res[i].object.value).to.equal('Sonja');
						expect(res[i].predicate.value).to.equal('http://wonderland#name');
						expect(res[i].subject.value).to.equal(mouse["@id"]);
					}
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
	});
});
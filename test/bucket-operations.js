'use strict'
var chai = require('chai'),
	expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

var path = require("path");
var _ = require("lodash");
var RDFcb = require("../build/index").LD;

var cfg = require("./config/config.json");
var triples = require("./data/data.json");
var extriples = require("./data/data_expanded.json");

var db = new RDFcb();
var bucket = db.bucket(cfg.bucket);;

describe('Operations', function() {
	this.timeout(10000);
	var rabbit = extriples[3];
	var tpname = "file://test#testprop";
	var tpval = 42;
	var testprop = {};
	testprop[tpname] = tpval;
	var nonex = {
		"@id": "http://whatever#itis0",
		"@type": "http://whatever#itis"
	};
	describe('#upsertNodes', function() {
		it('should upsert data', function(done) {
			var put = _.merge(_.cloneDeep(rabbit), testprop);
			var p = bucket.upsertNodes(put)
				.then(function(res) {
					return bucket.get(put["@id"]);
				})
				.then(function(res) {
					expect(res.value).to.have.deep.property(`${tpname}[0]`).with.property("@value", tpval);
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
	});
	describe('#replaceNodes', function() {
		it('should replace data', function(done) {
			var p = bucket.replaceNodes(rabbit)
				.then(function(res) {
					return bucket.get(rabbit["@id"]);
				})
				.then(function(res) {
					expect(res.value).to.not.have.property(tpname);
					expect(res.value).to.be.eql(rabbit);
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
		it('should return false on non-existent data', function(done) {
			var p = bucket.replaceNodes(nonex)
				.then(function(res) {
					expect(res[nonex["@id"]]).to.be.false;
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
	});
	describe('#insertNodes', function() {
		it('should insert data', function(done) {
			var p = bucket.remove(rabbit["@id"])
				.then(function(res) {
					return bucket.insertNodes(rabbit);
				})
				.then(function(res) {
					return bucket.get(rabbit["@id"]);
				})
				.then(function(res) {
					expect(res.value).to.be.eql(rabbit);
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
		it('should return false on existing data', function(done) {
			var p = bucket.insertNodes(rabbit)
				.then(function(res) {
					expect(res[rabbit["@id"]]).to.be.false;
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
	});
	describe('#getNodes', function() {
		it('should get data', function(done) {
			var p = bucket.getNodes(rabbit["@id"])
				.then(function(res) {
					expect(res).to.have.deep.property(`${rabbit["@id"]}.value`).which.is.eql(rabbit);
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
		it('should return undefined on non-existent', function(done) {
			var p = bucket.getNodes(nonex["@id"])
				.then(function(res) {
					expect(res[nonex["@id"]]).to.be.undefined;
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
	});
	describe('#removeNodes', function() {
		it('should remove data', function(done) {
			var p = bucket.removeNodes(rabbit["@id"])
				.then(function(res) {
					return bucket.get(rabbit["@id"]);
				})
				.then(function(res) {
					expect(res).to.be.undefined;
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
		it('should return false on non-existent', function(done) {
			var p = bucket.removeNodes(nonex["@id"])
				.then(function(res) {
					expect(res[nonex["@id"]]).to.be.false;
					done();
				})
				.catch(function(err) {
					done(err);
				});
		});
	});
});
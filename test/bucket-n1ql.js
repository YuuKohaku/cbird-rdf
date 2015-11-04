'use strict'
var chai = require('chai'),
    expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

var Couchbird = require("Couchbird");
var path = require("path");
var _ = require("lodash");
var ps = require("jsonld").promises;
var RDFcb = require("../build/core/RDF");

var cfg = require("./config.json");
var triples = require("./data.json");
var extriples = require("./data_expanded.json");
var defviews = require("../config/default-views.json");

var db = new RDFcb();
var bucket = db.bucket(cfg.bucket);;
bucket.enableN1ql();
var mgr = bucket.manager();

describe('N1QL', function () {
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
    before(function () {
        return ps.toRDF(mouse)
            .then(function (res) {
                rdfmouse = res["@default"];
                return bucket.N1QL(Couchbird.N1qlQuery.fromString("CREATE PRIMARY INDEX ON " + cfg.bucket + ";"))
            });
    });
    beforeEach(function () {
        return bucket.upsertNodes([rabbit, mouse]);
    });
    describe('#queryBySubject', function () {
        it('should return corresponding docs', function (done) {
            var p = bucket.queryBySubject(rabbit["@id"])
                .then(function (res) {
                    if (!_.findWhere(res, rabbit)) throw new Error("Incorrect response");
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });
    });
    describe('#queryByPredicate', function () {
        it('should return corresponding docs', function (done) {
            var p = bucket.queryByPredicate('http://wonderland#color')
                .then(function (res) {
                    if (!_.findWhere(res, rabbit)) throw new Error("Incorrect response");
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });
    });
    describe('#queryByObject', function () {
        it('should return corresponding docs', function (done) {
            var p = bucket.queryByObject('http://wonderland#white')
                .then(function (res) {
                    if (!_.findWhere(res, rabbit)) throw new Error("Incorrect response");
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });
    });
    describe('#queryByTriple {s p ?o}', function () {
        it('should return corresponding docs', function (done) {
            var p = bucket.queryByTriple({
                    subject: rabbit["@id"],
                    predicate: 'http://wonderland#color',
                    object: false
                })
                .then(function (res) {
                    if (!_.findWhere(res, rabbit)) throw new Error("Incorrect response");
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });
    });
    describe('#queryByTriple {s ?p o}', function () {
        it('should return corresponding docs', function (done) {
            var p = bucket.queryByTriple({
                    subject: rabbit["@id"],
                    predicate: false,
                    object: 'http://wonderland#white'
                })
                .then(function (res) {
                    if (!_.findWhere(res, rabbit)) throw new Error("Incorrect response");
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });
    });
    describe('#queryByTriple {?s p o}', function () {
        it('should return corresponding docs', function (done) {
            var p = bucket.queryByTriple({
                    subject: false,
                    predicate: '@type',
                    object: "http://wonderland#Rabbit"
                })
                .then(function (res) {
                    if (!_.findWhere(res, rabbit)) throw new Error("Incorrect response");
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });
    });
    describe('#queryByTriple {s p o}', function () {
        it('should return corresponding docs', function (done) {
            var p = bucket.queryByTriple({
                    subject: rabbit["@id"],
                    predicate: '@type',
                    object: "http://wonderland#Rabbit"
                })
                .then(function (res) {
                    if (!_.findWhere(res, rabbit)) throw new Error("Incorrect response");
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });
    });
    describe('#queryByTriple {?s ?p ?o}', function () {
        it('should return an empty array', function (done) {
            var p = bucket.queryByTriple({
                    subject: false,
                    predicate: false,
                    object: false
                })
                .then(function (res) {
                    if (!_.isEmpty(res) || !_.isArray(res)) throw new Error("Incorrect response");
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });
    });
    describe('#queryByTriple {? ? ?}', function () {
        it('should throw an error', function (done) {
            var p = bucket.queryByTriple({
                    subject: ["wow"],
                    predicate: false,
                    object: false
                })
                .then(function (res) {
                    done(new Error("Incorrect response"));
                })
                .catch(function (err) {
                    if (!/All passed values must be strings/.test(err.message))
                        done(new Error("Incorrect behaviour"));
                    done();
                });
        });
    });
});
'use strict'
var chai = require('chai'),
    expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

var Couchbase = require("couchbase");
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
var mgr = bucket.manager();

describe('Views', function () {
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
        return ps.toRDF(mouse).then(function (res) {
            rdfmouse = res["@default"];
        });
    });
    beforeEach(function () {
        return bucket.upsertNodes([rabbit, mouse]);
    });
    describe('#installViews', function () {
        it('should upsert views', function (done) {
            var p = bucket.installViews(path.resolve(__dirname, "../config/default-views.json"))
                .then(function (res) {
                    return mgr.getDesignDocuments();
                })
                .then(function (res) {
                    for (var i in defviews) {
                        if (!_.eq(res[i], defviews[i])) throw new Error("Incorrect value");
                    }
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });
    });
    describe('#getDocBySubject', function () {
        it('should get corresponding docs', function (done) {
            var p = bucket.getDocBySubject(rabbit["@id"])
                .then(function (res) {
                    if (!_.eq(res[rabbit["@id"]], rabbit)) throw new Error("Incorrect value");
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });
    });
    describe('#getDocByObject', function () {
        it('should get corresponding docs', function (done) {
            var p = bucket.getDocByObject("http://wonderland#white")
                .then(function (res) {
                    if (!_.eq(res["http://wonderland#white"], rabbit)) throw new Error("Incorrect value");
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });
    });
    describe('#getDocByProperty', function () {
        it('should get corresponding docs', function (done) {
            var p = bucket.getDocByProperty('http://wonderland#color')
                .then(function (res) {
                    if (!_.eq(res['http://wonderland#color'], rabbit)) throw new Error("Incorrect value");
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });
    });
    describe('#getStatementBySubject', function () {
        it('should get corresponding docs', function (done) {
            var p = bucket.getStatementBySubject([mouse["@id"], rabbit["@id"]])
                .then(function (res) {
                    console.log(rdfmouse)
                    if (!_.eq(res[mouse["@id"]], rdfmouse)) throw new Error("Incorrect value");
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });
    });

});
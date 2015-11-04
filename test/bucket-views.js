'use strict'
var chai = require('chai'),
    expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

var path = require("path");
var _ = require("lodash");
var ps = require("jsonld").promises;
var RDFcb = require("../build").RDF;

var cfg = require("./config/config.json");
var triples = require("./data/data.json");
var extriples = require("./data/data_expanded.json");
var testviews = require("./config/views.json");
var defviews = require("../build/RDF/default/views.json");

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
        it('should upsert default views', function (done) {
            var p = bucket.installViews()
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
        it('should upsert views', function (done) {
            var p = bucket.installViews(path.resolve(__dirname, "./config/views.json"))
                .then(function (res) {
                    return mgr.getDesignDocuments();
                })
                .then(function (res) {
                    for (var i in testviews) {
                        if (!_.eq(res[i], testviews[i])) throw new Error("Incorrect value");
                    }
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });
    });
    describe('#uninstallViews', function () {
        it('should remove views', function (done) {
            var p = bucket.uninstallViews(_.keys(testviews))
                .then(function (res) {
                    return mgr.getDesignDocuments();
                })
                .then(function (res) {
                    for (var i in testviews) {
                        if (res[i]) done(new Error("Incorrect value"));
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
    describe('#getDocByPredicate', function () {
        it('should get corresponding docs', function (done) {
            var p = bucket.getDocByPredicate('http://wonderland#color')
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
                    for (var i in rdfmouse) {
                        if (!_.findWhere(res[mouse["@id"]], rdfmouse[i])) throw new Error("Incorrect value");
                    }
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });
    });
    describe('#getStatementByPredicate', function () {
        it('should get corresponding docs', function (done) {
            var p = bucket.getStatementByPredicate('http://wonderland#name')
                .then(function (res) {
                    if (!_.findWhere(rdfmouse, res['http://wonderland#name'][0])) throw new Error("Incorrect value");
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });
    });
    describe('#getStatementByObject', function () {
        it('should get corresponding docs', function (done) {
            var p = bucket.getStatementByObject('http://wonderland#Mouse')
                .then(function (res) {
                    if (!_.findWhere(rdfmouse, res['http://wonderland#Mouse'][0])) throw new Error("Incorrect value");
                    done();
                })
                .catch(function (err) {
                    done(err);
                });
        });
    });

});
'use strict'
var chai = require('chai'),
    expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

var Couchbase = require("couchbase");
var path = require("path");
var _ = require("lodash");
var RDFcb = require("../build/core/RDF");

var cfg = require("./config.json");
var triples = require("./data.json");
var extriples = require("./data_expanded.json");
var defviews = require("../config/default-views.json");

var db = new RDFcb();
var bucket = db.bucket(cfg.bucket);;
var mgr = bucket.manager();

describe('Views', function () {
    var rabbit = extriples[3];
    var nonex = {
        "@id": "http://whatever#itis0",
        "@type": "http://whatever#itis"
    };
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
});
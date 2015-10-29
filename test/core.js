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

var db = null;
var bucket = null;

describe('Database initialization', function () {
    describe('without config', function () {
        it('should connect to localhost', function () {
            db = new RDFcb();
            expect(db).to.have.property('couchbird').with.property('configured', true);
            expect(db).to.have.property('couchbird').with.property('_server_ip', '127.0.0.1');
            expect(db).to.have.property('couchbird').with.property('_n1ql', '127.0.0.1:8093');
            expect(db).to.have.property('couchbird').with.property('_cluster').which.is.not.empty;
            expect(db).to.have.property('couchbird').with.property('ViewQuery').which.is.not.empty;
            expect(db).to.have.property('couchbird').with.property('N1qlQuery').which.is.not.empty;
        });
    });
    describe('with config', function () {
        it('should connect by config', function () {
            db = new RDFcb(cfg.couchbird, true);
            expect(db).to.have.property('couchbird').with.property('configured', true);
            expect(db).to.have.property('couchbird').with.property('_server_ip', cfg.couchbird.server_ip);
            expect(db).to.have.property('couchbird').with.property('_n1ql', cfg.couchbird.n1ql);
            expect(db).to.have.property('couchbird').with.property('_cluster').which.is.not.empty;
            expect(db).to.have.property('couchbird').with.property('ViewQuery').which.is.not.empty;
            expect(db).to.have.property('couchbird').with.property('N1qlQuery').which.is.not.empty;
        });
    });
});
describe('Bucket initialization', function () {
    describe('connection', function () {
        it('should connect to bucket', function () {
            bucket = db.bucket(cfg.bucket);
            expect(db).to.have.property('couchbird').with.deep.property('_buckets.' + cfg.bucket).which.is.eql(bucket).and.not.empty;
        });
    });
    describe('vocabularies loading', function () {
        it('should load vocabularies  from database', function () {
            var p = bucket.setVocabulary({
                domain: "iris/vocabulary/domain",
                basic: "iris/vocabulary/basic"
            });
            expect(p).to.eventually.have.deep.property('vocabulary.domain').which.is.not.empty;
            expect(p).to.eventually.have.deep.property('vocabulary.basic').which.is.not.empty;
            expect(p).to.eventually.have.deep.property('vocabulary.context').which.is.not.empty;
        });
        it('should load vocabularies from filesystem', function () {
            var p = bucket.setVocabulary({
                domain: path.resolve(__dirname, "iris_domain.json"),
                basic: path.resolve(__dirname, "iris_basic.json"),
                fs: true
            });
            expect(p).to.eventually.have.deep.property('vocabulary.domain').which.is.not.empty;
            expect(p).to.eventually.have.deep.property('vocabulary.basic').which.is.not.empty;
        });
    });
});
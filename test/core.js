var chai = require('chai'),
    expect = chai.expect;

var Couchbase = require("couchbase");
var RDFcb = require("../build/core/RDF");

var cfg = require("./config.json");

var db = null;

describe('Database initialization', function () {
    describe('without config', function () {
        it('should connect to localhost', function () {
            db = new RDFcb();
            console.log(db.couchbird)
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
            db = new RDFcb(cfg.db, true);
            console.log(db.couchbird)
            expect(db).to.have.property('couchbird').with.property('configured', true);
            expect(db).to.have.property('couchbird').with.property('_server_ip', cfg.db.server_ip);
            expect(db).to.have.property('couchbird').with.property('_n1ql', cfg.db.n1ql);
            expect(db).to.have.property('couchbird').with.property('_cluster').which.is.not.empty;
            expect(db).to.have.property('couchbird').with.property('ViewQuery').which.is.not.empty;
            expect(db).to.have.property('couchbird').with.property('N1qlQuery').which.is.not.empty;
        });
    });
});
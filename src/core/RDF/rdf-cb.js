'use strict'
let _ = require("lodash");
let Promise = require("bluebird");
let jsonld = require("jsonld");
var fs = Promise.promisifyAll(require("fs"));

let Couchbird = require("Couchbird");
let Bucket = Couchbird.Bucket;


class CBStore {
    constructor(config, reinit) {
        this.couchbird = Couchbird(config, reinit);
        this.buckets = {};
        return this;
    }


    bucket(bname) {
        if (!this.couchbird)
            throw new Error("Database is not connected");
        return this.couchbird.bucket(bname, CBStoreBucket);
    }

}

class CBStoreBucket extends Bucket {
    setVocabulary({
        domain: domain_voc,
        basic: basic_voc,
        fs: from_fs
    }) {
        if (!domain_voc || !basic_voc)
            throw new Error("Insufficient vocabulary information.");
        this.vocabulary = {
            basic: null,
            domain: null
        };
        if (!from_fs) {
            return Promise.props({
                    domain: super.get(domain_voc),
                    basic: super.get(basic_voc)
                })
                .then((res) => {
                    this.vocabulary.basic = res.basic.value;
                    this.vocabulary.domain = res.domain.value;
                    return Promise.resolve(this);
                });
        } else {
            return Promise.props({
                    domain: fs.readFileAsync(domain_voc).then(JSON.parse),
                    basic: fs.readFileAsync(basic_voc).then(JSON.parse)
                })
                .then((res) => {
                    this.vocabulary.basic = res.basic;
                    this.vocabulary.domain = res.domain;
                    return Promise.resolve(this);
                })
                .catch(SyntaxError, (e) => {
                    throw new Error("Invalid json in vocabulary files: ", e.message);
                })
                .catch(Promise.OperationalError, (e) => {
                    throw new Error("Unable to read vocabulary file: ", e.message);
                });
        }
    }

    store(triples, options = {}) {
        let promises = {};
        let data = {};
        return jsonld.promises.expand(triples)
            .then((res) => {
                _.map(res, (val) => {
                    data[val["@id"]] = val;
                    promises[val["@id"]] =
                        this.get(val["@id"])
                        .then((doc) => {
                            let value = doc.value;
                            let key = value["@id"];
                            return this.upsert(key, _.merge(value, data[key]), options);
                        });
                });
                return Promise.all(promises);
            })
            .catch((err) => {
                throw new Error("Unable to store data: ", err.message);
            });
    }

    replaceNodes(triples, options = {}) {
        let promises = {};
        let data = {};
        return jsonld.promises.expand(triples)
            .then((res) => {
                _.map(res, (val) => {
                    data[val["@id"]] = val;
                    promises[val["@id"]] =
                        this.upsert(val["@id"], val, options);
                });
                return Promise.all(promises);
            })
            .catch((err) => {
                throw new Error("Unable to store data: ", err.message);
            });

    }

    insert(subject, value, options = {}) {
        return super.insert(subject, value, options);
    }

    upsert(subject, value, options = {}) {
        return super.upsert(subject, value, options);
    }

    replace(subject, value, options = {}) {
        return super.replace(subject, value, options);
    }

    get(subject, options = {}) {
        return super.get(subject, options);
    }

    getAndLock(subject, options = {}) {
        return super.getAndLock(subject, options);
    }

    unlock(subject, cas, options = {}) {
        return super.unlock(subject, cas, options);
    }

    getAndTouch(subject, expiry, options = {}) {
        return super.getAndTouch(subject, expiry, options);
    }

    touch(subject, expiry, options = {}) {
        return super.touch(subject, options);
    }

    getMulti(subjects) {
        return super.getMulti(subjects);
    }

    //!! possibly this will make other docs invalid because of non-existent node
    remove(subject, options = {}) {
        return super.remove(subject, options);
    }

}

module.exports = CBStore;
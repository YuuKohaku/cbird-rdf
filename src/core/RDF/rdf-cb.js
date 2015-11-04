'use strict'
let _ = require("lodash");
let Promise = require("bluebird");
let jsonld = require("jsonld");
let fs = Promise.promisifyAll(require("fs"));
let path = require("path");

let Couchbird = require("Couchbird");
let Bucket = Couchbird.Bucket;


class CBStore {
    constructor(config, reinit) {
        this.couchbird = Couchbird(config, reinit);
        return this;
    }


    bucket(bname) {
        if (!this.couchbird)
            throw new Error("Database is not connected");
        return this.couchbird.bucket(bname, CBStoreBucket);
    }

}

class CBStoreBucket extends Bucket {

    /////////////////////////////////vocabulary installation//////////////////////////
    setVocabulary({
        domain: domain_voc,
        basic: basic_voc,
        fs: from_fs
    }) {
        if (!domain_voc || !basic_voc)
            return Promise.reject(new Error("Insufficient vocabulary information."));
        this.vocabulary = {
            basic: null,
            domain: null,
            context: null
        };
        if (!from_fs) {
            return Promise.props({
                    domain: super.get(domain_voc),
                    basic: super.get(basic_voc)
                })
                .then((res) => {
                    this.vocabulary.basic = res.basic.value;
                    this.vocabulary.domain = res.domain.value;
                    this.vocabulary.context = _.merge(res.basic.value["@context"], res.domain.value["@context"]);
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
                    this.vocabulary.context = _.merge(res.basic["@context"], res.domain["@context"]);
                    return Promise.resolve(this);
                })
                .catch(SyntaxError, (e) => {
                    return Promise.reject(new Error("Invalid json in vocabulary files: ", e.message));
                })
                .catch(Promise.OperationalError, (e) => {
                    return Promise.reject(new Error("Unable to read vocabulary file: ", e.message));
                });
        }
    }

    /////////////////////////Nodes operations//////////////////////////////
    //nodes upsert
    upsertNodes(triples, options = {}) {
        let promises = {};
        return jsonld.promises.expand(triples)
            .then((res) => {
                _.map(res, (val) => {
                    promises[val["@id"]] =
                        this.upsert(val["@id"], val, options)
                        .catch((err) => {
                            return Promise.resolve(err);
                        });
                });
                return Promise.props(promises);
            })
            .catch((err) => {
                return Promise.reject(new Error("Unable to store data: ", err.message));
            });
    }

    //replaces existing nodes with given ones
    replaceNodes(triples, options = {}) {
        let promises = {};
        return jsonld.promises.expand(triples)
            .then((res) => {
                _.map(res, (val) => {
                    promises[val["@id"]] =
                        this.replace(val["@id"], val, options)
                        .catch((err) => {
                            return Promise.resolve(err);
                        });
                });
                return Promise.props(promises);
            })
            .catch((err) => {
                return Promise.reject(new Error("Unable to store data: ", err.message));
            });
    }

    getNodes(subjects) {
        let promises = [];
        let keys = _.isArray(subjects) ? subjects : [subjects];
        return this.getMulti(keys)
            .then((res) => {
                _.map(res, (val) => {
                    promises.push(val.value);
                });
                return Promise.all(promises);
            });
    }

    //!! possibly this will make other docs invalid because of non-existent node
    removeNodes(subjects) {
        let keys = _.isArray(subjects) ? subjects : [subjects];
        let promises = [];
        _.map(keys, (key) => {
            promises.push(this.remove(key));
        });
        return Promise.all(promises);
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

    remove(subject, options = {}) {
        return super.remove(subject, options);
    }

    /////////////////////Views functions////////////////////////
    //Views installation
    //default-views.json by default
    installViews(fname) {
        let mgr = this.manager();

        return fs.readFileAsync(fname)
            .then((res) => {
                let doc = JSON.parse(res);
                let promises = [];
                for (var i in doc) {
                    promises.push(mgr.upsertDesignDocument(i, doc[i]));
                }
                return Promise.all(promises);
            })
            .catch((err) => {
                return Promise.reject(new Error("Unable to install views from ", fname));
            });
    }

    //Doc query section
    //leaving these functions non-unified in case of need for different processing

    getDocBySubject(subject) {
        let keys = _.isArray(subject) ? subject : [subject];
        let query = Couchbird.ViewQuery.from("rdf", "subject")
            .keys(keys)
            .custom({
                inclusive_end: true
            })
            .include_docs(true);
        return this.view(query)
            .then((res) => {
                return _.reduce(res, (acc, val) => {
                    acc[val.key] = val.doc;
                    return acc;
                }, {});
            });
    }

    getDocByPredicate(subject) {
        let keys = _.isArray(subject) ? subject : [subject];
        let query = Couchbird.ViewQuery.from("rdf", "predicate")
            .keys(keys)
            .custom({
                inclusive_end: true
            })
            .include_docs(true);
        return this.view(query)
            .then((res) => {
                return _.reduce(res, (acc, val) => {
                    acc[val.key] = val.doc;
                    return acc;
                }, {});
            });
    }

    getDocByObject(subject) {
        let keys = _.isArray(subject) ? subject : [subject];
        let query = Couchbird.ViewQuery.from("rdf", "object")
            .keys(keys)
            .custom({
                inclusive_end: true
            })
            .include_docs(true);
        return this.view(query)
            .then((res) => {
                return _.reduce(res, (acc, val) => {
                    acc[val.key] = val.doc;
                    return acc;
                }, {});
            });
    }

    //Statement query section
    getStatementBySubject(subject) {
        let keys = _.isArray(subject) ? subject : [subject];
        let query = Couchbird.ViewQuery.from("rdf", "jsonld-subject")
            .keys(keys)
            .custom({
                inclusive_end: true
            })
            .reduce(true)
            .group(true);
        return this.view(query)
            .then((res) => {
                return _.reduce(res, (acc, val) => {
                    acc[val.key] = val.value;
                    return acc;
                }, {});
            });
    }
    getStatementByPredicate(subject) {
        let keys = _.isArray(subject) ? subject : [subject];
        let query = Couchbird.ViewQuery.from("rdf", "jsonld-predicate")
            .keys(keys)
            .custom({
                inclusive_end: true
            })
            .reduce(true)
            .group(true);
        return this.view(query)
            .then((res) => {
                return _.reduce(res, (acc, val) => {
                    acc[val.key] = val.value;
                    return acc;
                }, {});
            });
    }
    getStatementByObject(subject) {
            let keys = _.isArray(subject) ? subject : [subject];
            let query = Couchbird.ViewQuery.from("rdf", "jsonld-object")
                .keys(keys)
                .custom({
                    inclusive_end: true
                })
                .reduce(true)
                .group(true);
            return this.view(query)
                .then((res) => {
                    return _.reduce(res, (acc, val) => {
                        acc[val.key] = val.value;
                        return acc;
                    }, {});
                });
        }
        //N1QL
        //expand with querybytriple with ?s ?p ?o
    queryByTriple({
        subject: s,
        predicate: p,
        object: o
    }) {
        if (!s && !p && !o) {
            return Promise.resolve([]);
        }
        if (s && !_.isString(s) || p && !_.isString(p) || o && !_.isString(o)) {
            return Promise.reject(new Error("All passed values must be strings."));
        }

        let qstr = "SELECT * FROM `" + this.bucket_name + "` AS doc ";
        let params = [];
        if (s && !p && !o) {
            qstr += "USE KEYS $1";
            params = [[s]];
        }
        if (!s && p && !o) {
            //until they fix this bug with forward-slash escaping 
            qstr += "WHERE $1 IN object_names(doc);";
            params = [p];
        }
        if (!s && !p && o) {
            qstr += "WHERE $1 WITHIN doc;"
            params = [o];
        }
        if (s && p && !o) {
            //until they fix this bug with forward-slash escaping 
            qstr += "USE KEYS $1 WHERE $2 IN object_names(doc);";
            params = [[s], p];
        }
        if (s && !p && o) {
            qstr += "USE KEYS $1 WHERE $2 WITHIN doc;";
            params = [[s], o];
        }
        if (!s && p && o) {
            //INJECTION WARNING! Need to correct this later.
            qstr += "WHERE $1 WITHIN doc.`" + p + "`;";
            params = [o];
        }
        if (s && p && o) {
            //INJECTION WARNING! Need to correct this later.
            qstr += "USE KEYS $1 WHERE $2 WITHIN doc.`" + p + "`;";
            params = [[s], o];
        }
        let query = Couchbird.N1qlQuery.fromString(qstr);
        return this.N1QL(query, params)
            .then((res) => {
                return _.map(res, (val) => {
                    return val.doc;
                });
            });
    }

    queryBySubject(val) {
        return this.queryByTriple({
            subject: val,
            predicate: false,
            object: false
        });
    }
    queryByPredicate(val) {
        return this.queryByTriple({
            subject: false,
            predicate: val,
            object: false
        });
    }
    queryByObject(val) {
        return this.queryByTriple({
            subject: false,
            predicate: false,
            object: val
        });
    }

}

module.exports = CBStore;
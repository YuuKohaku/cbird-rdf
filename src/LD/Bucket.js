'use strict'
let _ = require("lodash");
let Promise = require("bluebird");
let jsonld = require("jsonld").promises;
let fs = Promise.promisifyAll(require("fs"));
let path = require("path");

let Couchbird = require("Couchbird");
let Bucket = Couchbird.Bucket;

let locate_ifaces = function(names) {
	let result = {};
	if (!_.isArray(names))
		return result;
	for (var i in names) {
		let iface = null;
		try {
			iface = require(`./Query/${names[i]}`);
			result[names[i]] = iface;
		} catch (e) {
			iface = null;
		}
	}
	return result;
}

class CBStorageBucket extends Bucket {
	constructor(...args) {
		super(...args);
		this.assignQueryInterfaces(['View', 'Statement', 'N1ql']);
	}

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
						domain: fs.readFileAsync(domain_voc)
							.then(JSON.parse),
						basic: fs.readFileAsync(basic_voc)
							.then(JSON.parse)
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
		///////////////////////////Query/////////////////////////////////////////
	assignQueryInterfaces(names) {
		let result = locate_ifaces(names);
		_.assign(this, result, (cur, query_class) => {
			return new query_class(this);
		});
	}

	/////////////////////////mass nodes operations//////////////////////////////
	//nodes upsert
	upsertNodes(triples, options = {}) {
		let promises = {};
		return jsonld.expand(triples)
			.then((res) => {
				_.map(res, (val) => {
					promises[val["@id"]] =
						this.upsert(val["@id"], val, options);
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
		return jsonld.expand(triples)
			.then((res) => {
				_.map(res, (val) => {
					promises[val["@id"]] =
						this.replace(val["@id"], val, options)
						.catch((err) => {
							return Promise.resolve(false);
						});
				});
				return Promise.props(promises);
			})
			.catch((err) => {
				return Promise.reject(new Error("Unable to store data: ", err.message));
			});
	}

	getNodes(subjects) {
		let promises = {};
		let keys = _.isArray(subjects) ? subjects : [subjects];
		_.map(keys, (key) => {
			promises[key] =
				this.get(key)
				.catch((err) => {
					return Promise.resolve(undefined);
				});
		});
		return Promise.props(promises);
	}

	//!! possibly this will make other docs invalid because of non-existent node
	removeNodes(subjects) {
		let keys = _.isArray(subjects) ? subjects : [subjects];
		let promises = {};
		_.map(keys, (key) => {
			promises[key] = this.remove(key)
				.catch((err) => {
					return Promise.resolve(false);
				});
		});
		return Promise.props(promises);
	}

	/////////////////////Views functions///////////////////////////
	//Views installation
	//default-views.json by default

	installViews(filename) {
		let mgr = this.manager();
		let fname = _.isString(filename) ? filename : path.resolve(__dirname, "default/views.json");

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

	uninstallViews(names) {
		let mgr = this.manager();
		let keys = _.isArray(names) ? names : [names];
		let promises = [];

		for (var i in keys) {
			promises.push(mgr.removeDesignDocument(keys[i]));
		}
		return Promise.all(promises)
			.catch((err) => {
				return Promise.reject(new Error("Unable to uninstall views  ", names));
			});
	}

}

module.exports = CBStorageBucket;
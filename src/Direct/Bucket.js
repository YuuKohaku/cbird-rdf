'use strict'
let _ = require("lodash");
let Promise = require("bluebird");
let fs = Promise.promisifyAll(require("fs"));
let path = require("path");

let Couchbird = require("Couchbird");
let Bucket = Couchbird.Bucket;

let locate_ifaces = function (names) {
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
		this.assignQueryInterfaces(['N1ql']);
		this.setOperationTimeout(100000)
	}

	///////////////////////////Query/////////////////////////////////////////
	assignQueryInterfaces(names) {
		let result = locate_ifaces(names);
		_.assignWith(this, result, (cur, query_class) => {
			return new query_class(this);
		});
	}

	/////////////////////////mass nodes operations//////////////////////////////
	insertNodes(triples, options = {}) {
		let promises = {};
		return Promise.resolve(_.castArray(triples))
			.then((res) => {
				_.map(res, (val) => {
					let opts = options[val["@id"]] || {};
					promises[val["@id"]] =
						this.insert(val["@id"], val, opts)
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

	//nodes upsert
	upsertNodes(triples, options = {}) {
		let promises = {};
		return Promise.resolve(_.castArray(triples))
			.then((res) => {
				_.map(res, (val) => {
					let opts = options[val["@id"]] || {};
					promises[val["@id"]] =
						this.upsert(val["@id"], val, opts)
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

	//replaces existing nodes with given ones
	replaceNodes(triples, options = {}) {
		let promises = {};
		return Promise.resolve(_.castArray(triples))
			.then((res) => {
				_.map(res, (val) => {
					let opts = options[val["@id"]] || {};
					promises[val["@id"]] =
						this.replace(val["@id"], val, opts)
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
		let keys = _.castArray(subjects);
		return Promise.map(keys, (key) => {
				return this.get(key)
					.catch((err) => {
						return Promise.resolve(undefined);
					});
			}, {
				concurrency: 1000
			})
			.then(res => {
				let found = _.keyBy(res, item => item && item.value['@id']);
				return _.reduce(keys, (acc, key) => {
					acc[key] = found[key];
					return acc;
				}, {});
			});
	}

	//!! possibly this will make other docs invalid because of non-existent node
	removeNodes(subjects) {
			let keys = _.castArray(subjects);
			let promises = {};
			_.map(keys, (key) => {
				promises[key] = this.remove(key)
					.catch((err) => {
						return Promise.resolve(false);
					});
			});
			return Promise.props(promises);
		}
		//finally, it came to counters
	counterInsert(cKey, cOptions, dValue, dOptions, delimiter) {
			var bucket = this._bucket;
			return new Promise((resolve, reject) => {
				bucket.counter(cKey, 1, cOptions, (err, res) => {
					if (err) {
						reject(new Error("DATABASE_ERROR", err));
					} else {
						//temporary, TODO: pass func or format string to form new id?
						var id = [dValue["@id"], res.value].join(delimiter || "/");
						dValue["@id"] = id;
						resolve(this.insertNodes(dValue, dOptions));
					}
				});
			});
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
		let keys = _.castArray(names);
		let promises = [];

		for (var i in keys) {
			promises.push(mgr.removeDesignDocument(keys[i]));
		}
		return Promise.all(promises)
			.catch((err) => {
				return Promise.reject(new Error("Unable to uninstall views  ", names));
			});
	}


	/////////////////////Inherited///////////////////////////

	insert(subject, value, options = {}) {
		return super.insert(subject, value, options)
			.catch((err) => {
				return Promise.resolve(false);
			});
	}

	upsert(subject, value, options = {}) {
		return super.upsert(subject, value, options)
			.catch((err) => {
				return Promise.resolve(undefined);
			});
	}
	replace(subject, value, options = {}) {
		return super.replace(subject, value, options)
			.catch((err) => {
				return Promise.resolve(false);
			});
	}

	get(subject, options = {}) {
		return super.get(subject, options)
			.catch((err) => {
				return Promise.resolve(undefined);
			});
	}

	getAndLock(subject, options = {}) {
		return super.getAndLock(subject, options)
			.catch((err) => {
				return Promise.resolve(undefined);
			});
	}

	unlock(subject, cas, options = {}) {
		return super.unlock(subject, cas, options)
			.catch((err) => {
				return Promise.resolve(false);
			});
	}

	getAndTouch(subject, expiry, options = {}) {
		return super.getAndTouch(subject, expiry, options)
			.catch((err) => {
				return Promise.resolve(undefined);
			});
	}

	touch(subject, expiry, options = {}) {
		return super.touch(subject, options)
			.catch((err) => {
				return Promise.resolve(false);
			});
	}

	getMulti(subjects) {
		return super.getMulti(subjects)
			.catch((err) => {
				return Promise.resolve(undefined);
			});
	}

	//!! possibly this will make other docs invalid because of non-existent node
	remove(subject, options = {}) {
		return super.remove(subject, options)
			.catch((err) => {
				return Promise.resolve(false);
			});
	}
}

module.exports = CBStorageBucket;

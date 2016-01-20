'use strict'

let _ = require('lodash');
let Abstract = require('./Abstract');
let ViewQuery = require("Couchbird").ViewQuery;
let Promise = require("bluebird");

function invertCharCase(ch) {
	let tmp = ch.toUpperCase();
	if(tmp === ch) {
		return ch.toLowerCase();
	}
	return tmp;
}

class JsonLDViewQuery extends Abstract {
	bySubject(subject) {
		let keys = _.isArray(subject) ? subject : [subject];
		let query = ViewQuery.from(this._db.bucket_name, "jsonld-subject")
			.keys(keys)
			.custom({
				inclusive_end: true
			})
			.reduce(true)
			.group(true);

		return this._db.view(query)
			.then((res) => {
				return _.reduce(res, (acc, val) => {
					acc[val.key] = _.flatten(val.value);
					return acc;
				}, {});
			});
	}

	byPredicate(subject) {
		let keys = _.isArray(subject) ? subject : [subject];
		let query = ViewQuery.from(this._db.bucket_name, "jsonld-predicate")
			.keys(keys)
			.custom({
				inclusive_end: true
			})
			.reduce(true)
			.group(true);

		return this._db.view(query)
			.then((res) => {
				return _.reduce(res, (acc, val) => {
					acc[val.key] = _.flatten(val.value);
					return acc;
				}, {});
			});
	}

	byObject(subject) {
		let keys = _.isArray(subject) ? subject : [subject];
		let query = ViewQuery.from(this._db.bucket_name, "jsonld-object")
			.keys(keys)
			.custom({
				inclusive_end: true
			})
			.reduce(true)
			.group(true);

		return this._db.view(query)
			.then((res) => {
				return _.reduce(res, (acc, val) => {
					acc[val.key] = _.flatten(val.value);
					return acc;
				}, {});
			});
	}

	byTriple({
		subject: s = null,
		predicate: p = null,
		object: o = null
	}) {
		if(s && !_.isString(s) || p && !_.isString(p) || o && !_.isString(o)) {
			return Promise.reject(new Error("All passed values must be strings."));
		}

		if(!s && !p && !o) {
			return Promise.resolve([]);
		}

		if(s && !p && o) {
			return this.bySubject(s)
				.then((res) => {
					let data = _.filter(res[s], (val) => {
						return _.isEqual(val.object.value, o);
					});
					return Promise.resolve(data);
				});
		}
		if(!s && p && !o) {
			return this.byPredicate(p)
				.then((res) => {
					return Promise.resolve(res[p]);
				});
		}
		if(!s && p && o) {
			return this.byPredicate(p)
				.then((res) => {
					let data = _.filter(res[p], (val) => {
						return _.isEqual(val.object.value, o);
					});
					return Promise.resolve(data);
				});
		}
		if(!s && !p && o) {
			return this.byObject(o)
				.then((res) => {
					return Promise.resolve(res[o]);
				});

		}
		if(s && !p && !o) {
			return this.bySubject(s)
				.then((res) => {
					return Promise.resolve(res[s]);
				});
		}

		let query = ViewQuery.from(this._db.bucket_name, "jsonld")
			.reduce(true)
			.custom({
				inclusive_end: true
			});
		let end = null;
		let endkey = "";

		if(s && p && !o) {
			// couchbase magic
			end = p.charCodeAt(p.length - 1);
			end++;
			endkey = p.slice(0, p.length - 1) + invertCharCase(String.fromCharCode(end));

			query
				.group_level(2)
				.range([s, p], [s, endkey], true);
		}
		if(s && p && o) {
			// couchbase magic
			end = o.charCodeAt(o.length - 1);
			end++;
			endkey = o.slice(0, o.length - 1) + invertCharCase(String.fromCharCode(end));

			query
				.group_level(3)
				.range([s, p, o], [s, p, o], true);
		}
		return this._db.view(query)
			.then((res) => {
				return _.flatten(_.map(res, (val) => {
					return val.value;
				}));
			});

	}
}
module.exports = JsonLDViewQuery;
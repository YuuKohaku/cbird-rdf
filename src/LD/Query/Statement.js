'use strict'

let _ = require('lodash');
let Abstract = require('./Abstract');
let ViewQuery = require("Couchbird").ViewQuery;

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
					acc[val.key] = val.value;
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
					acc[val.key] = val.value;
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
					acc[val.key] = val.value;
					return acc;
				}, {});
			});
	}
}

module.exports = JsonLDViewQuery;
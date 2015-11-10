'use strict'

let _ = require('lodash');
let Abstract = require('./Abstract');
let ViewQuery = require("Couchbird").ViewQuery;

class LDViewQuery extends Abstract {
	bySubject(subject) {
		let keys = _.isArray(subject) ? subject : [subject];
		let query = ViewQuery.from(this._db.bucket_name, "subject")
			.keys(keys)
			.custom({
				inclusive_end: true
			})
			.include_docs(true);
		return this._db.view(query)
			.then((res) => {
				return _.reduce(res, (acc, val) => {
					acc[val.key] = val.doc;
					return acc;
				}, {});
			});
	}

	byPredicate(subject) {
		let keys = _.isArray(subject) ? subject : [subject];
		let query = ViewQuery.from(this._db.bucket_name, "predicate")
			.keys(keys)
			.custom({
				inclusive_end: true
			})
			.include_docs(true);
		return this._db.view(query)
			.then((res) => {
				return _.reduce(res, (acc, val) => {
					acc[val.key] = val.doc;
					return acc;
				}, {});
			});
	}

	byObject(subject) {
		let keys = _.isArray(subject) ? subject : [subject];
		let query = ViewQuery.from(this._db.bucket_name, "object")
			.keys(keys)
			.custom({
				inclusive_end: true
			})
			.include_docs(true);
		return this._db.view(query)
			.then((res) => {
				return _.reduce(res, (acc, val) => {
					acc[val.key] = val.doc;
					return acc;
				}, {});
			});
	}

}

module.exports = LDViewQuery;
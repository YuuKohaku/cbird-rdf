'use strict'

let _ = require('lodash');
let Abstract = require('./Abstract');
let N1qlQuery = require("Couchbird").N1qlQuery;
let Promise = require("bluebird");

class N1qlRDQuery extends Abstract {
	query({
		select = null,
		query,
		params
	}) {
		let sel = select || "*";

		let qstr = "SELECT " + sel + " FROM `" + this._db.bucket_name + "` " + query;
		let q = N1qlQuery.fromString(qstr);
		return this._db.N1QL(q, params)
			.then((res) => {
				return _.map(res, val => {
					return sel !== "*" ? val : val[this._db.bucket_name];
				});
			});
	}

	direct({
		query,
		params
	}) {
		let q = N1qlQuery.fromString(query);
		return this._db.N1QL(q, params);
	}
}

module.exports = N1qlRDQuery;
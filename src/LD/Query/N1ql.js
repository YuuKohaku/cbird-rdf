'use strict'

let _ = require('lodash');
let Abstract = require('./Abstract');
let N1qlQuery = require("Couchbird").N1qlQuery;
let Promise = require("bluebird");

class N1qlLDQuery extends Abstract {
	bySubject(val) {
		return this.byTriple({
			subject: val,
			predicate: null,
			object: null
		});
	}

	byPredicate(val) {
		return this.byTriple({
			subject: null,
			predicate: val,
			object: null
		});
	}

	byObject(val) {
		return this.byTriple({
			subject: null,
			predicate: null,
			object: val
		});
	}

	byTriple({
		select: prop = null,
		subject: s = null,
		predicate: p = null,
		object: o = null
	}) {
		if(!s && !p && !o) {
			return Promise.resolve([]);
		}
		if(s && !_.isString(s) || p && !_.isString(p) || o && !_.isString(o)) {
			return Promise.reject(new Error("All passed values must be strings."));
		}
		let sel = prop || "*";

		let qstr = "SELECT * FROM `" + this._db.bucket_name + "` AS doc ";
		let params = [];
		if(s && !p && !o) {
			qstr += "USE KEYS $1";
			params = [
				[s]
			];
		}
		if(!s && p && !o) {
			//until they fix this bug with forward-slash escaping
			qstr += "WHERE $1 IN object_names(doc);";
			params = [p];
		}
		if(!s && !p && o) {
			qstr += "WHERE $1 WITHIN doc;"
			params = [o];
		}
		if(s && p && !o) {
			//until they fix this bug with forward-slash escaping
			qstr += "USE KEYS $1 WHERE $2 IN object_names(doc);";
			params = [
				[s], p
			];
		}
		if(s && !p && o) {
			qstr += "USE KEYS $1 WHERE $2 WITHIN doc;";
			params = [
				[s], o
			];
		}
		if(!s && p && o) {
			//INJECTION WARNING! Need to correct this later.
			qstr += "WHERE $1 WITHIN doc.`" + p + "`;";
			params = [o];
		}
		if(s && p && o) {
			//INJECTION WARNING! Need to correct this later.
			qstr += "USE KEYS $1 WHERE $2 WITHIN doc.`" + p + "`;";
			params = [
				[s], o
			];
		}
		let query = N1qlQuery.fromString(qstr);
		return this._db.N1QL(query, params)
			.then((res) => {
				return _.map(res, (val) => {
					return val.doc;
				});
			});
	}
}

module.exports = N1qlLDQuery;
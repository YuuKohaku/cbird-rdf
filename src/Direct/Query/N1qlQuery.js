'use strict'

let _ = require('lodash');
let Abstract = require('./Abstract');
let N1qlQuery = require("Couchbird").N1qlQuery;
let Promise = require("bluebird");

class N1qlRDQuery extends Abstract {
	select() {}
	from() {}
	join() {}
	nest() {}
	unnest() {}
}

module.exports = N1qlRDQuery;
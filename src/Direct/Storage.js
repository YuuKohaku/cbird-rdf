'use strict'
let Bucket = require('./Bucket');
let Couchbird = require("Couchbird");

class CBStorage {
	constructor(config, reinit) {
		this.couchbird = Couchbird(config, reinit);
		return this;
	}


	bucket(bname) {
		if (!this.couchbird)
			throw new Error("Database is not connected");
		return this.couchbird.bucket(bname, Bucket);
	}

}

module.exports = CBStorage;
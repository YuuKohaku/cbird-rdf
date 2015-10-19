let _ = require("lodash");
let Promise = require("bluebird");
let Couchbird = require("Couchbird");
let Bucket = Couchbird.Bucket;

class CBStore {
    constructor(config, reinit) {
        console.log("CONF", config, reinit)
        this.couchbird = Couchbird(config, reinit);
        this.buckets = {};
        return this;
    }

    bucket(bname) {
        if (!this.couchbird)
            throw new Error("Database is not connected");
        if (this.buckets[bname])
            return this.buckets[bname];
        this.buckets[bname] = new CBStoreBucket(this.couchbird.bucket(bname));
    }

}

class CBStoreBucket extends Bucket {

}

module.exports = CBStore;
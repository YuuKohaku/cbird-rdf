'use strict'

let Promise = require("bluebird");
let _ = require("lodash");

let bucket = false;

class Abstract {

    //selector_data - db_id or selector data
    //selector - selector name
    //cases : new Example("example/1") == new Example(1) == new Example({type: example, id: 1}, "Default")
    constructor() {
        if (!bucket)
            throw new Error("Database is not settled.");

        this.db = bucket; //should be already initialized
        this.db_value = false; //no scheme for abstract
        this.cas = false; //still unknown but probably existing

        //no db loading in constructor
        return this;
    }

    static setDatabase(db) {
        bucket = db;
    }

    //selector name and params {db: db_id, compose_data: {...}}. Specify either db or compose data for selector. Db is priority.
    setSelector() {
        let Selector = require(__dirname + "/Selector/Abstract");
        this._selector = Selector;
    }

    getFromDatabase() {
        throw new Error("Abstract method.")
    }

    getAndLock() {
        throw new Error("Abstract method.")
    }

    getAndTouch() {
        throw new Error("Abstract method.")
    }
    unlock() {
        throw new Error("Abstract method.")
    }

    insert() {
        throw new Error("Abstract method.")
    }

    upsert() {
        throw new Error("Abstract method.")
    }

    remove() {
        throw new Error("Abstract method.")
    }

    //without cas
    removeUnsafe() {
        throw new Error("Abstract method.")
    }
}

module.exports = Abstract;
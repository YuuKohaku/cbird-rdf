'use strict'

let Promise = require("bluebird");
let _ = require("lodash");
let Abstract = require("./Abstract");


class Basic extends Abstract {

    //selector_data - db_id or selector data
    //selector - selector name
    //cases : new Example("example/1") == new Example(1) == new Example({type: example, id: 1}, "Default")
    constructor(selector_data, selector) {
        //selector name - specified or the same as class name
        super();

        let sel = _.capitalize(selector) || this.constructor.name;
        let sel_data = {};
        let db_id = false;

        if (!selector_data || (!_.isNumber(selector_data) && !_.isObject(selector_data) && !_.isString(selector_data)))
            throw new Error("Incorrect selector data.")

        if (_.isNumber(selector_data)) {
            //number will be passed as id
            sel_data.type = _.snakeCase(this.constructor.name);
            sel_data.id = selector_data;
        } else if (_.isObject(selector_data)) {
            sel_data = selector_data;
        } else {
            db_id = selector_data;
        }

        //sets selector object, database selector(db_id), type and id for this
        this.setSelector(sel, {
            db: db_id,
            compose_data: sel_data
        });

        //no db loading in constructor
        return this;
    }

    //selector name and params {db: db_id, compose_data: {...}}. Specify either db or compose data for selector. Db is priority.
    setSelector(name, opts) {
        if (!name)
            throw new Error("Not enough arguments to set the selector.");

        let params = opts || {};
        let Selector = false;
        try {
            Selector = require(__dirname + "/Selector/" + name);
        } catch (e) {
            Selector = require(__dirname + "/Selector/Default");
        }

        let selector = params.db || params.compose_data && (Selector.compose(params.compose_data)) || this.selector;
        let compose_data = Selector.decompose(selector);
        console.log("Setting selector", name, params, selector);

        this._selector = Selector;
        Object.defineProperties(this, {
            "_selector": {
                value: Selector,
                configurable: false,
                writable: true,
                enumerable: false
            },
            "selector": {
                value: selector,
                configurable: true,
                writable: false,
                enumerable: true
            },
            "type": {
                value: compose_data.type,
                configurable: true,
                writable: false,
                enumerable: true
            }
        });
    }

    getFromDatabase() {
        console.log("Get from db:", this.selector, this.type)
        return this.db.get(this.selector)
            .then((res) => {
                //return from db
                //                console.log("Got this from db:", res);
                this.cas = res.cas;
                if (!this.db_value)
                    this.db_value = {};
                //TODO: Transform from RDF here
                _.merge(this.db_value, res.value);
                return Promise.resolve(this);
            })
            .catch((err) => {
                console.log('Could not get from db: ', err);
                return Promise.resolve(this);
            });
    }

    getAndLock(time) {
        let opts = {}
        if (time) opts.lockTime = time;

        return this.db.getAndLock(this.selector, opts)
            .then((res) => {
                //return from db
                this.cas = res.cas;
                _.merge(this.db_value, res.value);
                return Promise.resolve(this);
            })
            .catch((err) => {
                console.log('Could not get and lock: ', err);
                return Promise.resolve(this);
            });
    }

    getAndTouch(expiry) {
        return this.db.getAndTouch(this.selector, expiry)
            .then((res) => {
                //return from db
                this.cas = res.cas;
                _.merge(this.db_value, res.value);
                return Promise.resolve(this);
            })
            .catch((err) => {
                console.log('Could not get and lock: ', err);
                return Promise.resolve(this);
            });
    }
    unlock() {
        return this.db.unlock(this.selector, this.cas)
            .then(() => {
                //return from db
                return Promise.resolve(this);
            })
            .catch((err) => {
                console.log('Could not unlock: ', err.stack);
                return Promise.resolve(this);
            });
    }

    insert(data) {
        if (data)
            _.merge(this.db_value, data);

        //        console.log("INSERT", this.db_value);
        return this.db.insert(this.selector, this.db_value)
            .then((res) => {
                //return from db
                this.cas = res.cas;
                return Promise.resolve(this);
            });
    }

    upsert(data) {
        if (data)
            _.merge(this.db_value, data);

        let opts = this.cas ? {
            cas: this.cas
        } : {};


        return this.db.upsert(this.selector, this.db_value, opts)
            .then((res) => {
                //return from db
                this.cas = res.cas;
                return Promise.resolve(this);
            });
    }

    remove() {
        return this.db.remove(this.selector, {
                cas: this.cas
            })
            .then((res) => {
                this.cas = res.cas;
                this.db_value = false;
                return Promise.resolve(this);
            })
            .catch((err) => {
                console.log('Could not remove from db: ', err);
                return Promise.resolve(this);
            });
    }

    //without cas
    removeUnsafe() {
        return this.db.remove(this.selector)
            .then((res) => {
                this.cas = res.cas;
                this.db_value = false;
                return Promise.resolve(this);
            })
            .catch((err) => {
                console.log('Could not remove from db: ', err);
                return Promise.resolve(this);
            });
    }
}

module.exports = Basic;
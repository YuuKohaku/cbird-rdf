'use strict'

let _ = require("lodash");
let bucket = false;
let Promise = require("bluebird");
let ModelObject = require("../Object/Abstract");
let DefaultSelector = require("../Object/Selector/Default");

class AbstractCollection {
    constructor() {
        this.collection = {}; //[{key: el/1, value: {}}]
        if (!bucket)
            throw new Error("Database is not settled.");
        this.db = bucket;

    }

    static setDatabase(db) {
        bucket = db;
    }

    //when loading, search for type in Model.Object; if not found, create default object (Abstract)
    //so strange
    loadFromDatabase() {
        let promises = _.map(this.keys, (key) => {
            let ob_key = key;
            let obj = false;
            if (_.isObject(key)) {
                if (!key.selector || !key.id)
                    throw new Error("Specify key object as {id: 'example/1', selector: 'Example'}");
                let Selector = ModelObject.Selector[_.capitalize(key.selector)];
                ob_key = key.id;
                if (!Selector)
                    throw new Error("Specified selector not found.");
                let type = Selector.decompose(ob_key).type;
                let obj_class = ModelObject[_.capitalize(type)] || ModelObject.Abstract;
                console.log("Creating object of type ", type, " with selector ", key.selector)
                obj = new obj_class(ob_key, key.selector);
            } else {
                let type = DefaultSelector.decompose(key).type;
                console.log("Creating object of type ", type);
                let obj_class = ModelObject[_.capitalize(type)];
                if (!obj_class) {
                    obj = new ModelObject.Basic(ob_key, type);
                } else {
                    obj = new obj_class(ob_key);
                }
            }
            return obj.getFromDatabase()
                .then(() => {
                    this.collection[ob_key] = obj;
                });
        });

        return Promise.all(promises);
    }

    toArray() {
        return _.values(this.collection);
    }

    toMap() {
        return this.collection;
    }

    [Symbol.iterator]() {
        let cur = 0;
        let arr = this.toArray();
        let len = arr.length;
        return {
            next() {
                let done = (cur == len);
                cur++;
                return {
                    done: done,
                    value: arr[cur - 1]
                }
            }
        }
    }
}

module.exports = AbstractCollection;
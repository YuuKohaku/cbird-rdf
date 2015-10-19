'use strict'

let Abstract = require("./Abstract");
let _ = require("lodash");

class BasicCollection extends Abstract {
    constructor(params) {
        super(params);
        this.keys = _.isArray(params) ? params : [];
    }

    loadFromDatabase() {
        return super.loadFromDatabase();
    }
}

module.exports = BasicCollection;
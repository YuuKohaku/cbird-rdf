'use strict'

let _ = require("lodash");
let Promise = require("bluebird");
let View = require("./View");

class TypedCollection extends View {
    constructor(params) {
        if (!params.type)
            throw new Error("Specify type of collection in params.");
        let view = {
            from: {
                ddoc: 'object',
                name: 'type'
            },
            limit: params.limit || false,
            offset: params.offset || false,
            key: params.type,
            range: {
                start: params.type,
                end: params.type,
                inclusive_end: true
            }
        };
        super(view);
    }

}

module.exports = TypedCollection;
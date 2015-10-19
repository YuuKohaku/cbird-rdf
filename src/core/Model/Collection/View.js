'use strict'

let _ = require("lodash");
let Promise = require("bluebird");
let Couchbird = require("Couchbird")();
let Basic = require("./Basic");

class ViewCollection extends Basic {
    constructor(params) {
        super(params);
        this.view = {
            from: {
                ddoc: 'object',
                name: false
            },
            limit: false,
            offset: false,
            id_range: {
                start: undefined,
                end: undefined
            },
            keys: false,
            key: false,
            stale: false,
            group: false,
            range: {
                start: undefined,
                end: undefined,
                inclusive_end: true
            },
            order: false
        };
        _.merge(this.view, params);
    }

    //when loading, search for type in Model.Object; if not found, create default object (Abstract)
    //so strange
    loadFromDatabase() {
        let vq = Couchbird.ViewQuery.from(this.view.from.ddoc, this.view.from.name)
            .range(this.view.range.start, this.view.range.end, this.view.range.inclusive_end);
        if (this.view.id_range.start || this.view.id_range.end)
            vq.id_range(this.view.id_range.start, this.view.id_range.end);
        if (this.view.limit)
            vq.limit(this.limit);
        if (this.view.offset)
            vq.skip(this.offset);
        if (this.view.key)
            vq.key(this.view.key);
        if (this.view.keys)
            vq.keys(this.view.keys);
        if (this.view.stale)
            vq.stale(this.view.stale);
        if (this.view.order)
            vq.order(this.view.order);
        if (this.view.group)
            vq.group(this.view.group);

        return this.db.view(vq)
            .then((res) => {
                let data = res;
                this.keys = _.pluck(data, 'id');
                //                console.log("Got keys", this.keys);
                return super.loadFromDatabase();
            });
    }
}

module.exports = ViewCollection;
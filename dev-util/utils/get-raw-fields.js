'use strict'

let Promise = require("bluebird");
let fs = Promise.promisifyAll(require("fs"));
let path = require("path");
let _ = require("lodash");


module.exports = function (fname) {
	let p = path.parse(fname);
	p.name += "_fields";
	p.base = p.name + p.ext;
	let fin = path.format(p);

	return fs.readFileAsync(fname)
		.then((res) => {
			let data = (JSON.parse(res));
			let fields = [];
			_.map(data, (node) => {
				fields = _.union(fields, _.compact(_.map(node, (field, key) => {
					return _.startsWith(key, '@') ? false : `${node['@type']}.${key}`;
				})))
			})
			return fs.writeFileAsync(fin, JSON.stringify(fields, null, 4));
		});

}

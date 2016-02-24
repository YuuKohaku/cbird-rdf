'use strict'

let Promise = require("bluebird");
let fs = Promise.promisifyAll(require("fs"));
let path = require("path");
let _ = require("lodash");


module.exports = function (fname) {
	let p = path.parse(fname);
	p.name += "_uncast";
	p.base = p.name + p.ext;
	let fin = path.format(p);

	return fs.readFileAsync(fname)
		.then((res) => {
			let data = (JSON.parse(res));
			let new_data = [];
			_.map(data, (node) => {
				new_data.push(_.mapValues(node, (field, key) => {
					return _.isArray(field) && _.size(field) == 1 ? field[0] : field;
				}));
			})
			return fs.writeFileAsync(fin, JSON.stringify(new_data, null, 4));
		});

}

'use strict'

let Promise = require("bluebird");
let fs = Promise.promisifyAll(require("fs"));
let path = require("path");
let _ = require("lodash");


module.exports = function(fname) {
	let p = path.parse(fname);
	p.name += "_parsed";
	p.base = p.name + p.ext;
	let fin = path.format(p);

	return fs.readFileAsync(fname)
		.then((res) => {
			let data = (JSON.parse(res));
			return _.map(data, (node) => {
				let result = {};
				result["@id"] = _.last(node['@id'].split("#"));
				result["@type"] = _.last(node['@type'][0].split("#"));

				_.map(node, (db_data, key) => {
					if(key == "@id" || key == "@type") return;
					let db_val = _.castArray(db_data);
					let val = _.map(db_val, (piece) => {
						if(!_.isObject(piece)) return piece;
						return piece['@id'] || piece['@value'];
					})
					let k = _.last(key.split("#"));
					console.log(k, val);
					result[_.snakeCase(k)] = val;
				});
				return result;
			})
		})
		.then((res) => {
			return fs.writeFileAsync(fin, JSON.stringify(res, null, 4));
		});

}
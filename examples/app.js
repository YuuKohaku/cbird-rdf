'use strict'

let Couchbird = require("Couchbird")({
    server_ip: "127.0.0.1",
    n1ql: "127.0.0.1:8093"
}).bucket("rdf");

let triples = require("../test/data.json");
let jsonld = require("jsonld");
let Promise = require("bluebird");
let fs = Promise.promisifyAll(require("fs"));

let ps = jsonld.promises;
let expand = require("../test/utils/expand");

expand("./test/data.json");

function _graphToRDF(graph) {
    function _isKeyword(v) {
        if (!_isString(v)) {
            return false;
        }
        switch (v) {
        case '@base':
        case '@context':
        case '@container':
        case '@default':
        case '@embed':
        case '@explicit':
        case '@graph':
        case '@id':
        case '@index':
        case '@language':
        case '@list':
        case '@omitDefault':
        case '@preserve':
        case '@requireAll':
        case '@reverse':
        case '@set':
        case '@type':
        case '@value':
        case '@vocab':
            return true;
        }
        return false;
    }
    var XSD_BOOLEAN = 'http://www.w3.org/2001/XMLSchema#boolean';
    var XSD_DOUBLE = 'http://www.w3.org/2001/XMLSchema#double';
    var XSD_INTEGER = 'http://www.w3.org/2001/XMLSchema#integer';
    var XSD_STRING = 'http://www.w3.org/2001/XMLSchema#string';

    var RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
    var RDF_LIST = RDF + 'List';
    var RDF_FIRST = RDF + 'first';
    var RDF_REST = RDF + 'rest';
    var RDF_NIL = RDF + 'nil';
    var RDF_TYPE = RDF + 'type';
    var RDF_PLAIN_LITERAL = RDF + 'PlainLiteral';
    var RDF_XML_LITERAL = RDF + 'XMLLiteral';
    var RDF_OBJECT = RDF + 'object';
    var RDF_LANGSTRING = RDF + 'langString';

    function _objectToRDF(item) {
        var object = {};

        // convert value object to RDF
        if (_isValue(item)) {
            object.type = 'literal';
            var value = item['@value'];
            var datatype = item['@type'] || null;

            // convert to XSD datatypes as appropriate
            if (_isBoolean(value)) {
                object.value = value.toString();
                object.datatype = datatype || XSD_BOOLEAN;
            } else if (_isDouble(value) || datatype === XSD_DOUBLE) {
                if (!_isDouble(value)) {
                    value = parseFloat(value);
                }
                // canonical double representation
                object.value = value.toExponential(15).replace(/(\d)0*e\+?/, '$1E');
                object.datatype = datatype || XSD_DOUBLE;
            } else if (_isNumber(value)) {
                object.value = value.toFixed(0);
                object.datatype = datatype || XSD_INTEGER;
            } else if ('@language' in item) {
                object.value = value;
                object.datatype = datatype || RDF_LANGSTRING;
                object.language = item['@language'];
            } else {
                object.value = value;
                object.datatype = datatype || XSD_STRING;
            }
        } else {
            // convert string/node object to RDF
            var id = _isObject(item) ? item['@id'] : item;
            object.type = (id.indexOf('_:') === 0) ? 'blank node' : 'IRI';
            object.value = id;
        }

        // skip relative IRIs
        if (object.type === 'IRI' && !_isAbsoluteIri(object.value)) {
            return null;
        }

        return object;
    }
    var rval = [];

    var ids = Object.keys(graph).sort();
    for (var i = 0; i < ids.length; ++i) {
        var id = ids[i];
        var node = graph[id];
        var properties = Object.keys(node).sort();
        for (var pi = 0; pi < properties.length; ++pi) {
            var property = properties[pi];
            var items = node[property];
            if (property === '@type') {
                property = RDF_TYPE;
            } else if (_isKeyword(property)) {
                continue;
            }

            for (var ii = 0; ii < items.length; ++ii) {
                var item = items[ii];

                // RDF subject
                var subject = {};
                subject.type = (id.indexOf('_:') === 0) ? 'blank node' : 'IRI';
                subject.value = id;

                // RDF predicate
                var predicate = {};
                predicate.type = (property.indexOf('_:') === 0) ? 'blank node' : 'IRI';
                predicate.value = property;

                // skip blank node predicates unless producing generalized RDF
                if (predicate.type === 'blank node') {
                    continue;
                }

                // convert @list to triples
                if ('@list' in item) {
                    _listToRDF(item['@list'], issuer, subject, predicate, rval);
                } else {
                    // convert value or node object to triple
                    var object = _objectToRDF(item);
                    // skip null objects (they are relative IRIs)
                    if (object) {
                        rval.push({
                            subject: subject,
                            predicate: predicate,
                            object: object
                        });
                    }
                }
            }
        }
    }

    return rval;
}
    var jsonld = {};
    var _nodejs = (typeof module !== 'undefined');
    jsonld.toRDF = function (input, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        options = options || {};

        if (!('base' in options)) {
            options.base = (typeof input === 'string') ? input : '';
        }

        var dataset;
        try {
            // output RDF dataset
            dataset = Processor.prototype.toRDF(input, options);
            if (options.format) {
                if (options.format === 'application/nquads') {
                    return callback(null, _toNQuads(dataset));
                }
                throw new JsonLdError(
                    'Unknown output format.',
                    'jsonld.UnknownFormat', {
                        format: options.format
                    });
            }
        } catch (ex) {
            return callback(ex);
        }
        callback(null, dataset);
    };
    jsonld.prependBase = function (base, iri) {
        return _prependBase(base, iri);
    };

    jsonld.ActiveContextCache = function (size) {
        this.order = [];
        this.cache = {};
        this.size = size || 100;
    };
    jsonld.ActiveContextCache.prototype.get = function (activeCtx, localCtx) {
        var key1 = JSON.stringify(activeCtx);
        var key2 = JSON.stringify(localCtx);
        var level1 = this.cache[key1];
        if (level1 && key2 in level1) {
            return level1[key2];
        }
        return null;
    };
    jsonld.ActiveContextCache.prototype.set = function (
        activeCtx, localCtx, result) {
        if (this.order.length === this.size) {
            var entry = this.order.shift();
            delete this.cache[entry.activeCtx][entry.localCtx];
        }
        var key1 = JSON.stringify(activeCtx);
        var key2 = JSON.stringify(localCtx);
        this.order.push({
            activeCtx: key1,
            localCtx: key2
        });
        if (!(key1 in this.cache)) {
            this.cache[key1] = {};
        }
        this.cache[key1][key2] = _clone(result);
    };

    jsonld.cache = {
        activeCtx: new jsonld.ActiveContextCache()
    };

    jsonld.hasProperty = function (subject, property) {
        var rval = false;
        if (property in subject) {
            var value = subject[property];
            rval = (!_isArray(value) || value.length > 0);
        }
        return rval;
    };

    jsonld.hasValue = function (subject, property, value) {
        var rval = false;
        if (jsonld.hasProperty(subject, property)) {
            var val = subject[property];
            var isList = _isList(val);
            if (_isArray(val) || isList) {
                if (isList) {
                    val = val['@list'];
                }
                for (var i = 0; i < val.length; ++i) {
                    if (jsonld.compareValues(value, val[i])) {
                        rval = true;
                        break;
                    }
                }
            } else if (!_isArray(value)) {
                // avoid matching the set of values with an array value parameter
                rval = jsonld.compareValues(value, val);
            }
        }
        return rval;
    };

    jsonld.addValue = function (subject, property, value, options) {
        options = options || {};
        if (!('propertyIsArray' in options)) {
            options.propertyIsArray = false;
        }
        if (!('allowDuplicate' in options)) {
            options.allowDuplicate = true;
        }

        if (_isArray(value)) {
            if (value.length === 0 && options.propertyIsArray &&
                !(property in subject)) {
                subject[property] = [];
            }
            for (var i = 0; i < value.length; ++i) {
                jsonld.addValue(subject, property, value[i], options);
            }
        } else if (property in subject) {
            // check if subject already has value if duplicates not allowed
            var hasValue = (!options.allowDuplicate &&
                jsonld.hasValue(subject, property, value));

            // make property an array if value not present or always an array
            if (!_isArray(subject[property]) &&
                (!hasValue || options.propertyIsArray)) {
                subject[property] = [subject[property]];
            }

            // add new value
            if (!hasValue) {
                subject[property].push(value);
            }
        } else {
            // add new value as set or single value
            subject[property] = options.propertyIsArray ? [value] : value;
        }
    };

    jsonld.getValues = function (subject, property) {
        var rval = subject[property] || [];
        if (!_isArray(rval)) {
            rval = [rval];
        }
        return rval;
    };

    jsonld.removeProperty = function (subject, property) {
        delete subject[property];
    };
    jsonld.removeValue = function (subject, property, value, options) {
        options = options || {};
        if (!('propertyIsArray' in options)) {
            options.propertyIsArray = false;
        }

        // filter out value
        var values = jsonld.getValues(subject, property).filter(function (e) {
            return !jsonld.compareValues(e, value);
        });

        if (values.length === 0) {
            jsonld.removeProperty(subject, property);
        } else if (values.length === 1 && !options.propertyIsArray) {
            subject[property] = values[0];
        } else {
            subject[property] = values;
        }
    };

    jsonld.compareValues = function (v1, v2) {
        // 1. equal primitives
        if (v1 === v2) {
            return true;
        }

        // 2. equal @values
        if (_isValue(v1) && _isValue(v2) &&
            v1['@value'] === v2['@value'] &&
            v1['@type'] === v2['@type'] &&
            v1['@language'] === v2['@language'] &&
            v1['@index'] === v2['@index']) {
            return true;
        }

        // 3. equal @ids
        if (_isObject(v1) && ('@id' in v1) && _isObject(v2) && ('@id' in v2)) {
            return v1['@id'] === v2['@id'];
        }

        return false;
    };

    jsonld.getContextValue = function (ctx, key, type) {
        var rval = null;

        // return null for invalid key
        if (key === null) {
            return rval;
        }

        // get default language
        if (type === '@language' && (type in ctx)) {
            rval = ctx[type];
        }

        // get specific entry information
        if (ctx.mappings[key]) {
            var entry = ctx.mappings[key];

            if (_isUndefined(type)) {
                // return whole entry
                rval = entry;
            } else if (type in entry) {
                // return entry value for type
                rval = entry[type];
            }
        }

        return rval;
    };

    if (_nodejs) {
        // needed for serialization of XML literals
        if (typeof XMLSerializer === 'undefined') {
            var XMLSerializer = null;
        }
        if (typeof Node === 'undefined') {
            var Node = {
                ELEMENT_NODE: 1,
                ATTRIBUTE_NODE: 2,
                TEXT_NODE: 3,
                CDATA_SECTION_NODE: 4,
                ENTITY_REFERENCE_NODE: 5,
                ENTITY_NODE: 6,
                PROCESSING_INSTRUCTION_NODE: 7,
                COMMENT_NODE: 8,
                DOCUMENT_NODE: 9,
                DOCUMENT_TYPE_NODE: 10,
                DOCUMENT_FRAGMENT_NODE: 11,
                NOTATION_NODE: 12
            };
        }
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

    var LINK_HEADER_REL = 'http://www.w3.org/ns/json-ld#context';
    var MAX_CONTEXT_URLS = 10;
    var JsonLdError = function (msg, type, details) {
        if (_nodejs) {
            Error.call(this);
            Error.captureStackTrace(this, this.constructor);
        }
        this.name = type || 'jsonld.Error';
        this.message = msg || 'An unspecified JSON-LD error occurred.';
        this.details = details || {};
    };
    if (_nodejs) {
        require('util').inherits(JsonLdError, Error);
    }
    var Processor = function () {};

    Processor.prototype.toRDF = function (input, options) {
        // create node map for default graph (and any named graphs)
        var issuer = new IdentifierIssuer('_:b');
        var nodeMap = {
            '@default': {}
        };
        _createNodeMap(input, nodeMap, '@default', issuer);

        var dataset = {};
        var graphNames = Object.keys(nodeMap).sort();
        for (var i = 0; i < graphNames.length; ++i) {
            var graphName = graphNames[i];
            // skip relative IRIs
            if (graphName === '@default' || _isAbsoluteIri(graphName)) {
                dataset[graphName] = _graphToRDF(nodeMap[graphName], issuer, options);
            }
        }
        return dataset;
    };


    function _graphToRDF(graph, issuer, options) {
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

                    // skip relative IRI subjects
                    if (!_isAbsoluteIri(id)) {
                        continue;
                    }

                    // RDF predicate
                    var predicate = {};
                    predicate.type = (property.indexOf('_:') === 0) ? 'blank node' : 'IRI';
                    predicate.value = property;

                    // skip relative IRI predicates
                    if (!_isAbsoluteIri(property)) {
                        continue;
                    }

                    // skip blank node predicates unless producing generalized RDF
                    if (predicate.type === 'blank node' && !options.produceGeneralizedRdf) {
                        continue;
                    }

                    // convert @list to triples
                    if (_isList(item)) {
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


    function _listToRDF(list, issuer, subject, predicate, triples) {
        var first = {
            type: 'IRI',
            value: RDF_FIRST
        };
        var rest = {
            type: 'IRI',
            value: RDF_REST
        };
        var nil = {
            type: 'IRI',
            value: RDF_NIL
        };

        for (var i = 0; i < list.length; ++i) {
            var item = list[i];

            var blankNode = {
                type: 'blank node',
                value: issuer.getId()
            };
            triples.push({
                subject: subject,
                predicate: predicate,
                object: blankNode
            });

            subject = blankNode;
            predicate = first;
            var object = _objectToRDF(item);

            // skip null objects (they are relative IRIs)
            if (object) {
                triples.push({
                    subject: subject,
                    predicate: predicate,
                    object: object
                });
            }

            predicate = rest;
        }

        triples.push({
            subject: subject,
            predicate: predicate,
            object: nil
        });
    }

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

    function _compareRDFTriples(t1, t2) {
        var attrs = ['subject', 'predicate', 'object'];
        for (var i = 0; i < attrs.length; ++i) {
            var attr = attrs[i];
            if (t1[attr].type !== t2[attr].type || t1[attr].value !== t2[attr].value) {
                return false;
            }
        }
        if (t1.object.language !== t2.object.language) {
            return false;
        }
        if (t1.object.datatype !== t2.object.datatype) {
            return false;
        }
        return true;
    }

    function _createNodeMap(input, graphs, graph, issuer, name, list) {
        // recurse through array
        if (_isArray(input)) {
            for (var i = 0; i < input.length; ++i) {
                _createNodeMap(input[i], graphs, graph, issuer, undefined, list);
            }
            return;
        }

        // add non-object to list
        if (!_isObject(input)) {
            if (list) {
                list.push(input);
            }
            return;
        }

        // add values to list
        if (_isValue(input)) {
            if ('@type' in input) {
                var type = input['@type'];
                // rename @type blank node
                if (type.indexOf('_:') === 0) {
                    input['@type'] = type = issuer.getId(type);
                }
            }
            if (list) {
                list.push(input);
            }
            return;
        }

        // Note: At this point, input must be a subject.

        // spec requires @type to be named first, so assign names early
        if ('@type' in input) {
            var types = input['@type'];
            for (var i = 0; i < types.length; ++i) {
                var type = types[i];
                if (type.indexOf('_:') === 0) {
                    issuer.getId(type);
                }
            }
        }

        // get name for subject
        if (_isUndefined(name)) {
            name = _isBlankNode(input) ? issuer.getId(input['@id']) : input['@id'];
        }

        // add subject reference to list
        if (list) {
            list.push({
                '@id': name
            });
        }

        // create new subject or merge into existing one
        var subjects = graphs[graph];
        var subject = subjects[name] = subjects[name] || {};
        subject['@id'] = name;
        var properties = Object.keys(input).sort();
        for (var pi = 0; pi < properties.length; ++pi) {
            var property = properties[pi];

            // skip @id
            if (property === '@id') {
                continue;
            }

            // handle reverse properties
            if (property === '@reverse') {
                var referencedNode = {
                    '@id': name
                };
                var reverseMap = input['@reverse'];
                for (var reverseProperty in reverseMap) {
                    var items = reverseMap[reverseProperty];
                    for (var ii = 0; ii < items.length; ++ii) {
                        var item = items[ii];
                        var itemName = item['@id'];
                        if (_isBlankNode(item)) {
                            itemName = issuer.getId(itemName);
                        }
                        _createNodeMap(item, graphs, graph, issuer, itemName);
                        jsonld.addValue(
                            subjects[itemName], reverseProperty, referencedNode, {
                                propertyIsArray: true,
                                allowDuplicate: false
                            });
                    }
                }
                continue;
            }

            // recurse into graph
            if (property === '@graph') {
                // add graph subjects map entry
                if (!(name in graphs)) {
                    graphs[name] = {};
                }
                var g = (graph === '@merged') ? graph : name;
                _createNodeMap(input[property], graphs, g, issuer);
                continue;
            }

            // copy non-@type keywords
            if (property !== '@type' && _isKeyword(property)) {
                if (property === '@index' && property in subject &&
                    (input[property] !== subject[property] ||
                        input[property]['@id'] !== subject[property]['@id'])) {
                    throw new JsonLdError(
                        'Invalid JSON-LD syntax; conflicting @index property detected.',
                        'jsonld.SyntaxError', {
                            code: 'conflicting indexes',
                            subject: subject
                        });
                }
                subject[property] = input[property];
                continue;
            }

            // iterate over objects
            var objects = input[property];

            // if property is a bnode, assign it a new id
            if (property.indexOf('_:') === 0) {
                property = issuer.getId(property);
            }

            // ensure property is added for empty arrays
            if (objects.length === 0) {
                jsonld.addValue(subject, property, [], {
                    propertyIsArray: true
                });
                continue;
            }
            for (var oi = 0; oi < objects.length; ++oi) {
                var o = objects[oi];

                if (property === '@type') {
                    // rename @type blank nodes
                    o = (o.indexOf('_:') === 0) ? issuer.getId(o) : o;
                }

                // handle embedded subject or subject reference
                if (_isSubject(o) || _isSubjectReference(o)) {
                    // relabel blank node @id
                    var id = _isBlankNode(o) ? issuer.getId(o['@id']) : o['@id'];

                    // add reference and recurse
                    jsonld.addValue(
                        subject, property, {
                            '@id': id
                        }, {
                            propertyIsArray: true,
                            allowDuplicate: false
                        });
                    _createNodeMap(o, graphs, graph, issuer, id);
                } else if (_isList(o)) {
                    // handle @list
                    var _list = [];
                    _createNodeMap(o['@list'], graphs, graph, issuer, name, _list);
                    o = {
                        '@list': _list
                    };
                    jsonld.addValue(
                        subject, property, o, {
                            propertyIsArray: true,
                            allowDuplicate: false
                        });
                } else {
                    // handle @value
                    _createNodeMap(o, graphs, graph, issuer, name);
                    jsonld.addValue(
                        subject, property, o, {
                            propertyIsArray: true,
                            allowDuplicate: false
                        });
                }
            }
        }
    }


    function _compareShortestLeast(a, b) {
        if (a.length < b.length) {
            return -1;
        }
        if (b.length < a.length) {
            return 1;
        }
        if (a === b) {
            return 0;
        }
        return (a < b) ? -1 : 1;
    }

    function _prependBase(base, iri) {
        // skip IRI processing
        if (base === null) {
            return iri;
        }
        // already an absolute IRI
        if (iri.indexOf(':') !== -1) {
            return iri;
        }

        // parse base if it is a string
        if (_isString(base)) {
            base = jsonld.url.parse(base || '');
        }

        // parse given IRI
        var rel = jsonld.url.parse(iri);

        // per RFC3986 5.2.2
        var transform = {
            protocol: base.protocol || ''
        };

        if (rel.authority !== null) {
            transform.authority = rel.authority;
            transform.path = rel.path;
            transform.query = rel.query;
        } else {
            transform.authority = base.authority;

            if (rel.path === '') {
                transform.path = base.path;
                if (rel.query !== null) {
                    transform.query = rel.query;
                } else {
                    transform.query = base.query;
                }
            } else {
                if (rel.path.indexOf('/') === 0) {
                    // IRI represents an absolute path
                    transform.path = rel.path;
                } else {
                    // merge paths
                    var path = base.path;

                    // append relative path to the end of the last directory from base
                    if (rel.path !== '') {
                        path = path.substr(0, path.lastIndexOf('/') + 1);
                        if (path.length > 0 && path.substr(-1) !== '/') {
                            path += '/';
                        }
                        path += rel.path;
                    }

                    transform.path = path;
                }
                transform.query = rel.query;
            }
        }

        // remove slashes and dots in path
        transform.path = _removeDotSegments(transform.path, !!transform.authority);

        // construct URL
        var rval = transform.protocol;
        if (transform.authority !== null) {
            rval += '//' + transform.authority;
        }
        rval += transform.path;
        if (transform.query !== null) {
            rval += '?' + transform.query;
        }
        if (rel.fragment !== null) {
            rval += '#' + rel.fragment;
        }

        // handle empty base
        if (rval === '') {
            rval = './';
        }

        return rval;
    }

    function _getInitialContext(options) {
        var base = jsonld.url.parse(options.base || '');
        return {
            '@base': base,
            mappings: {},
            inverse: null,
            getInverse: _createInverseContext,
            clone: _cloneActiveContext
        };

        /**
         * Generates an inverse context for use in the compaction algorithm, if
         * not already generated for the given active context.
         *
         * @return the inverse context.
         */
        function _createInverseContext() {
            var activeCtx = this;

            // lazily create inverse
            if (activeCtx.inverse) {
                return activeCtx.inverse;
            }
            var inverse = activeCtx.inverse = {};

            // handle default language
            var defaultLanguage = activeCtx['@language'] || '@none';

            // create term selections for each mapping in the context, ordered by
            // shortest and then lexicographically least
            var mappings = activeCtx.mappings;
            var terms = Object.keys(mappings).sort(_compareShortestLeast);
            for (var i = 0; i < terms.length; ++i) {
                var term = terms[i];
                var mapping = mappings[term];
                if (mapping === null) {
                    continue;
                }

                var container = mapping['@container'] || '@none';

                // iterate over every IRI in the mapping
                var ids = mapping['@id'];
                if (!_isArray(ids)) {
                    ids = [ids];
                }
                for (var ii = 0; ii < ids.length; ++ii) {
                    var iri = ids[ii];
                    var entry = inverse[iri];

                    // initialize entry
                    if (!entry) {
                        inverse[iri] = entry = {};
                    }

                    // add new entry
                    if (!entry[container]) {
                        entry[container] = {
                            '@language': {},
                            '@type': {}
                        };
                    }
                    entry = entry[container];

                    if (mapping.reverse) {
                        // term is preferred for values using @reverse
                        _addPreferredTerm(mapping, term, entry['@type'], '@reverse');
                    } else if ('@type' in mapping) {
                        // term is preferred for values using specific type
                        _addPreferredTerm(mapping, term, entry['@type'], mapping['@type']);
                    } else if ('@language' in mapping) {
                        // term is preferred for values using specific language
                        var language = mapping['@language'] || '@null';
                        _addPreferredTerm(mapping, term, entry['@language'], language);
                    } else {
                        // term is preferred for values w/default language or no type and
                        // no language
                        // add an entry for the default language
                        _addPreferredTerm(mapping, term, entry['@language'], defaultLanguage);

                        // add entries for no type and no language
                        _addPreferredTerm(mapping, term, entry['@type'], '@none');
                        _addPreferredTerm(mapping, term, entry['@language'], '@none');
                    }
                }
            }

            return inverse;
        }

        /**
         * Adds the term for the given entry if not already added.
         *
         * @param mapping the term mapping.
         * @param term the term to add.
         * @param entry the inverse context typeOrLanguage entry to add to.
         * @param typeOrLanguageValue the key in the entry to add to.
         */
        function _addPreferredTerm(mapping, term, entry, typeOrLanguageValue) {
            if (!(typeOrLanguageValue in entry)) {
                entry[typeOrLanguageValue] = term;
            }
        }

        /**
         * Clones an active context, creating a child active context.
         *
         * @return a clone (child) of the active context.
         */
        function _cloneActiveContext() {
            var child = {};
            child['@base'] = this['@base'];
            child.mappings = _clone(this.mappings);
            child.clone = this.clone;
            child.inverse = null;
            child.getInverse = this.getInverse;
            if ('@language' in this) {
                child['@language'] = this['@language'];
            }
            if ('@vocab' in this) {
                child['@vocab'] = this['@vocab'];
            }
            return child;
        }
    }

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

    function _isObject(v) {
        return (Object.prototype.toString.call(v) === '[object Object]');
    }

    function _isEmptyObject(v) {
        return _isObject(v) && Object.keys(v).length === 0;
    }

    function _isArray(v) {
        return Array.isArray(v);
    }

    function _validateTypeValue(v) {
        // can be a string or an empty object
        if (_isString(v) || _isEmptyObject(v)) {
            return;
        }

        // must be an array
        var isValid = false;
        if (_isArray(v)) {
            // must contain only strings
            isValid = true;
            for (var i = 0; i < v.length; ++i) {
                if (!(_isString(v[i]))) {
                    isValid = false;
                    break;
                }
            }
        }

        if (!isValid) {
            throw new JsonLdError(
                'Invalid JSON-LD syntax; "@type" value must a string, an array of ' +
                'strings, or an empty object.', 'jsonld.SyntaxError', {
                    code: 'invalid type value',
                    value: v
                });
        }
    }

    function _isString(v) {
        return (typeof v === 'string' ||
            Object.prototype.toString.call(v) === '[object String]');
    }

    function _isNumber(v) {
        return (typeof v === 'number' ||
            Object.prototype.toString.call(v) === '[object Number]');
    }

    function _isDouble(v) {
        return _isNumber(v) && String(v).indexOf('.') !== -1;
    }

    function _isNumeric(v) {
        return !isNaN(parseFloat(v)) && isFinite(v);
    }

    function _isBoolean(v) {
        return (typeof v === 'boolean' ||
            Object.prototype.toString.call(v) === '[object Boolean]');
    }

    function _isUndefined(v) {
        return (typeof v === 'undefined');
    }

    function _isSubject(v) {
        // Note: A value is a subject if all of these hold true:
        // 1. It is an Object.
        // 2. It is not a @value, @set, or @list.
        // 3. It has more than 1 key OR any existing key is not @id.
        var rval = false;
        if (_isObject(v) &&
            !(('@value' in v) || ('@set' in v) || ('@list' in v))) {
            var keyCount = Object.keys(v).length;
            rval = (keyCount > 1 || !('@id' in v));
        }
        return rval;
    }

    function _isSubjectReference(v) {
        // Note: A value is a subject reference if all of these hold true:
        // 1. It is an Object.
        // 2. It has a single key: @id.
        return (_isObject(v) && Object.keys(v).length === 1 && ('@id' in v));
    }

    function _isValue(v) {
        // Note: A value is a @value if all of these hold true:
        // 1. It is an Object.
        // 2. It has the @value property.
        return _isObject(v) && ('@value' in v);
    }

    function _isList(v) {
        // Note: A value is a @list if all of these hold true:
        // 1. It is an Object.
        // 2. It has the @list property.
        return _isObject(v) && ('@list' in v);
    }

    function _isBlankNode(v) {
        // Note: A value is a blank node if all of these hold true:
        // 1. It is an Object.
        // 2. If it has an @id key its value begins with '_:'.
        // 3. It has no keys OR is not a @value, @set, or @list.
        var rval = false;
        if (_isObject(v)) {
            if ('@id' in v) {
                rval = (v['@id'].indexOf('_:') === 0);
            } else {
                rval = (Object.keys(v).length === 0 ||
                    !(('@value' in v) || ('@set' in v) || ('@list' in v)));
            }
        }
        return rval;
    }

    function _isAbsoluteIri(v) {
        return _isString(v) && v.indexOf(':') !== -1;
    }

    function _clone(value) {
        if (value && typeof value === 'object') {
            var rval;
            if (_isArray(value)) {
                rval = [];
                for (var i = 0; i < value.length; ++i) {
                    rval[i] = _clone(value[i]);
                }
            } else if (_isObject(value)) {
                rval = {};
                for (var key in value) {
                    rval[key] = _clone(value[key]);
                }
            } else {
                rval = value.toString();
            }
            return rval;
        }
        return value;
    }
    if (!Object.keys) {
        Object.keys = function (o) {
            if (o !== Object(o)) {
                throw new TypeError('Object.keys called on non-object');
            }
            var rval = [];
            for (var p in o) {
                if (Object.prototype.hasOwnProperty.call(o, p)) {
                    rval.push(p);
                }
            }
            return rval;
        };
    }

    function _toNQuads(dataset) {
        var quads = [];
        for (var graphName in dataset) {
            var triples = dataset[graphName];
            for (var ti = 0; ti < triples.length; ++ti) {
                var triple = triples[ti];
                if (graphName === '@default') {
                    graphName = null;
                }
                quads.push(_toNQuad(triple, graphName));
            }
        }
        return quads.sort().join('');
    }

    function _toNQuad(triple, graphName) {
        var s = triple.subject;
        var p = triple.predicate;
        var o = triple.object;
        var g = graphName || null;
        if ('name' in triple && triple.name) {
            g = triple.name.value;
        }

        var quad = '';

        // subject is an IRI
        if (s.type === 'IRI') {
            quad += '<' + s.value + '>';
        } else {
            quad += s.value;
        }
        quad += ' ';

        // predicate is an IRI
        if (p.type === 'IRI') {
            quad += '<' + p.value + '>';
        } else {
            quad += p.value;
        }
        quad += ' ';

        // object is IRI, bnode, or literal
        if (o.type === 'IRI') {
            quad += '<' + o.value + '>';
        } else if (o.type === 'blank node') {
            quad += o.value;
        } else {
            var escaped = o.value
                .replace(/\\/g, '\\\\')
                .replace(/\t/g, '\\t')
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r')
                .replace(/\"/g, '\\"');
            quad += '"' + escaped + '"';
            if (o.datatype === RDF_LANGSTRING) {
                if (o.language) {
                    quad += '@' + o.language;
                }
            } else if (o.datatype !== XSD_STRING) {
                quad += '^^<' + o.datatype + '>';
            }
        }

        // graph
        if (g !== null && g !== undefined) {
            if (g.indexOf('_:') !== 0) {
                quad += ' <' + g + '>';
            } else {
                quad += ' ' + g;
            }
        }

        quad += ' .\n';
        return quad;
    }

    function IdentifierIssuer(prefix) {
        this.prefix = prefix;
        this.counter = 0;
        this.existing = {};
    }
    jsonld.IdentifierIssuer = IdentifierIssuer;
    jsonld.UniqueNamer = IdentifierIssuer;
    IdentifierIssuer.prototype.clone = function () {
        var copy = new IdentifierIssuer(this.prefix);
        copy.counter = this.counter;
        copy.existing = _clone(this.existing);
        return copy;
    };
    IdentifierIssuer.prototype.getId = function (old) {
        // return existing old identifier
        if (old && old in this.existing) {
            return this.existing[old];
        }

        // get next identifier
        var identifier = this.prefix + this.counter;
        this.counter += 1;

        // save mapping
        if (old) {
            this.existing[old] = identifier;
        }

        return identifier;
    };
    IdentifierIssuer.prototype.getName = IdentifierIssuer.prototype.getName;
    IdentifierIssuer.prototype.hasId = function (old) {
        return (old in this.existing);
    };
    IdentifierIssuer.prototype.isNamed = IdentifierIssuer.prototype.hasId;
    var Permutator = function (list) {
        // original array
        this.list = list.sort();
        // indicates whether there are more permutations
        this.done = false;
        // directional info for permutation algorithm
        this.left = {};
        for (var i = 0; i < list.length; ++i) {
            this.left[list[i]] = true;
        }
    };
    Permutator.prototype.hasNext = function () {
        return !this.done;
    };
    Permutator.prototype.next = function () {
        // copy current permutation
        var rval = this.list.slice();

        /* Calculate the next permutation using the Steinhaus-Johnson-Trotter
         permutation algorithm. */

        // get largest mobile element k
        // (mobile: element is greater than the one it is looking at)
        var k = null;
        var pos = 0;
        var length = this.list.length;
        for (var i = 0; i < length; ++i) {
            var element = this.list[i];
            var left = this.left[element];
            if ((k === null || element > k) &&
                ((left && i > 0 && element > this.list[i - 1]) ||
                    (!left && i < (length - 1) && element > this.list[i + 1]))) {
                k = element;
                pos = i;
            }
        }

        // no more permutations
        if (k === null) {
            this.done = true;
        } else {
            // swap k and the element it is looking at
            var swap = this.left[k] ? pos - 1 : pos + 1;
            this.list[pos] = this.list[swap];
            this.list[swap] = k;

            // reverse the direction of all elements larger than k
            for (var i = 0; i < length; ++i) {
                if (this.list[i] > k) {
                    this.left[this.list[i]] = !this.left[this.list[i]];
                }
            }
        }

        return rval;
    };

    jsonld.url = {};
    jsonld.url.parsers = {
        simple: {
            // RFC 3986 basic parts
            keys: ['href', 'scheme', 'authority', 'path', 'query', 'fragment'],
            regex: /^(?:([^:\/?#]+):)?(?:\/\/([^\/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?/
        },
        full: {
            keys: ['href', 'protocol', 'scheme', 'authority', 'auth', 'user', 'password', 'hostname', 'port', 'path', 'directory', 'file', 'query', 'fragment'],
            regex: /^(([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?(?:(((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/
        }
    };
    jsonld.url.parse = function (str, parser) {
        var parsed = {};
        var o = jsonld.url.parsers[parser || 'full'];
        var m = o.regex.exec(str);
        var i = o.keys.length;
        while (i--) {
            parsed[o.keys[i]] = (m[i] === undefined) ? null : m[i];
        }
        parsed.normalizedPath = _removeDotSegments(parsed.path, !!parsed.authority);
        return parsed;
    };

    /**
     * Removes dot segments from a URL path.
     *
     * @param path the path to remove dot segments from.
     * @param hasAuthority true if the URL has an authority, false if not.
     */
    function _removeDotSegments(path, hasAuthority) {
        var rval = '';

        if (path.indexOf('/') === 0) {
            rval = '/';
        }

        // RFC 3986 5.2.4 (reworked)
        var input = path.split('/');
        var output = [];
        while (input.length > 0) {
            if (input[0] === '.' || (input[0] === '' && input.length > 1)) {
                input.shift();
                continue;
            }
            if (input[0] === '..') {
                input.shift();
                if (hasAuthority ||
                    (output.length > 0 && output[output.length - 1] !== '..')) {
                    output.pop();
                } else {
                    // leading relative URL '..'
                    output.push('..');
                }
                continue;
            }
            output.push(input.shift());
        }

        return rval + output.join('/');
    }

    module.exports = jsonld;
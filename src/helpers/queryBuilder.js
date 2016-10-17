import db from '../migrations/index';
import * as table from '../models/index';

export function searchQueryCreator(queries, properties) {
    let createObj, query;
    createObj = { search: { $and: [], $or: [] }, relation: [], attributes: [] };

    for (let [key, value] of Object.entries(queries)) {
        query = (queries.like === "true") ? { $like: '%' + value + '%' } : value;

        propertiesSearch(key, query, properties, createObj.search.$and);
        propertiesRelation(queries, properties, key, value, createObj.relation);
        sum(properties, key, value, createObj.attributes);
        attributes(key, value, createObj.attributes);
        deletedAt(key, value, createObj.search.$and);
        propertiesRelationSearchAutoInclude(properties, key, value, createObj.relation);
    }

    querySearch(queries, properties, createObj.search.$or);
    queryFilter(queries, properties, createObj.search.$and);

    if (!createObj.search.$or[0]) {
        delete createObj.search.$or;
    }

    return (createObj.search.$and[0] || (createObj.search.$or && createObj.search.$or[0]) || createObj.relation[0] || createObj.attributes[0]) ? createObj : null;
}


export function orderRel(order, orderType, properties) {
    orderType = orderType || 'ASC';

    if (order && order.indexOf('.') !== -1) {
        let model = order.substr(0, order.indexOf('.')),
            orders = order.substr(order.indexOf('.') + 1),
            relation = properties.definedRelations.find((n) => n.name === model);

        return [
            [{ model: db[model], as: relation.as }, orders, orderType]
        ];
    } else {
        return [
            [order, orderType]
        ];
    }
}


function propertiesSearch(key, query, properties, object) {
    if (properties.model[key]) {
        object.push({
            [key]: query
        });
    }
}

function propertiesRelation(queries, properties, key, value, object) {
    if (!Array.isArray(queries[key]) && key === 'relation' && value === 'all') {
        object.push({
            all: true,
            nested: true
        });

    } else if (key === 'relation' && value !== 'all') {
        queries.relation = (!Array.isArray(queries[key])) ? queries.relation.split() : queries.relation;
        queries.relation.map((mod, i) => {
            let modelAs = properties.definedRelations.find((x) => x.as === mod);
            if (modelAs) {

                const index = object.findIndex((n) => n.as === modelAs.as),
                    nestedQueries = (queries[modelAs.as]) ? queries[modelAs.as] : null,
                    limit = (queries[`${modelAs.as}.limit`]) ? Number(queries[`${modelAs.as}.limit`]) : null,
                    required = (queries[`${modelAs.as}.required`] === "false") ? false : true,
                    attributes = (queries[`${modelAs.as}.attributes`]) ? queries[`${modelAs.as}.attributes`].split(',') : null,
                    exclude = (queries[`${modelAs.as}.exclude`]) ? { exclude: queries[`${modelAs.as}.exclude`].split(',') } : null;

                let include = [];

                nestedIncludes(queries, `${modelAs.as}`, modelAs, include);

                console.log(required);

                let queryObject = {
                    model: db[modelAs.name],
                    as: modelAs.as,
                    attributes: attributes || exclude,
                    include,
                    limit,
                    required
                };


                if (index === -1) {
                    object.push(queryObject);
                } else {
                    object[index] = Object.assign({}, object[index], queryObject);
                }
            }
        })
    }
}

function nestedIncludes(queries, name, model, object, previous) {
    previous = previous || '';
    for (let [key, value] of Object.entries(queries)) {
        propertiesRelationSearchAutoInclude(table[model.name], key, value, object);
        if (key.indexOf(`${name}.include`) !== -1) {
            queries[key] = (!Array.isArray(queries[key])) ? queries[key].split() : queries[key];
            queries[key].map((mod, i) => {
                let modelAs = (table[model.name] && table[model.name].definedRelations) ? table[model.name].definedRelations : null;
                if (modelAs) {
                    const relationModel = modelAs.find((n) => n.as === mod);
                    if (relationModel) {
                        const limit = (queries[`${previous}${name}.${relationModel.as}.limit`]) ? Number(queries[`${previous}${name}.${relationModel.as}.limit`]) : null,
                            required = (queries[`${modelAs.as}.required`] === "false") ? false : true,
                            attributes = (queries[`${previous}${name}.${relationModel.as}.attributes`]) ? queries[`${previous}${name}.${relationModel.as}.attributes`].split(',') : null,
                            exclude = (queries[`${previous}${name}.${relationModel.as}.exclude`]) ? { exclude: queries[`${previous}${name}.${relationModel.as}.exclude`].split(',') } : null;

                        let include = [];

                        nestedIncludes(queries, `${relationModel.as}`, relationModel, include, `${name}.${relationModel.as}.`);

                        object.push({
                            model: db[relationModel.name],
                            as: relationModel.as,
                            attributes: attributes || exclude,
                            include,
                            limit,
                            required
                        });
                    }
                }
            });
        }
    }
}

function sum(properties, key, value, object) {
    if (key === 'sum') {
        if (properties.model[value]) {
            object.push(
                [db.sequelize.fn('SUM', db.sequelize.col(value)), `sumOf${value}`]
            );
        }
    }
}

function attributes(key, value, object) {
    if (key === 'attributes') {
        let attrs = value.split(',');

        attrs.map((attr, i) => {
            object.push(attr);
        });
    }
}

function deletedAt(key, value, object) {
    if (key === 'deletedAt') {
        if (value === 'true') {
            object.push({
                [key]: { ne: null }
            });
        } else {
            object.push({
                [key]: null
            });
        }
    }
}

function propertiesRelationSearchAutoInclude(properties, key, query, object) {    
    if (properties.relations) {
        properties.definedRelations.map((pro, i) => {
            if (key.substring(0, key.indexOf('.') != -1 ? key.indexOf('.') : key.length) === pro.as) {
                let field = key.substr(key.indexOf(".") + 1);                
                if(field.indexOf('.like') !== -1){                    
                    field = field.substring(0, field.indexOf('.like'));
                    query =  { $like: '%' + query + '%' };                    
                }
                if (table[pro.name].model[field]) {
                    let index = object.findIndex((n) => n.model === db[pro.name]);
                    if (index !== -1) {
                        object[index].where = {
                            [field]: query
                        };
                    } else {
                        object.push({
                            model: db[pro.name],
                            where: {
                                [field]: query
                            },
                            as: pro.as
                        });
                    }
                }
            }
        });
    }
}

function querySearch(queries, properties, object) {
    if (queries.search) {
        const query = (queries.like === "true") ? { $like: '%' + queries.search + '%' } : queries.search;
        for (let [key, value] of Object.entries(properties.model)) {
            if (value.search !== false) {
                object.push({
                    [key]: query
                });
            }
        }
    }
}

function queryFilter(queries, properties, object) {
    if (queries.filter) {
        const filter = (properties.filters) ? properties.filters.find((n) => n.name === queries.filter) : null;

        if (Array.isArray(queries.filter)) {
            queries.filter.map((queFil, r) => {
                if (properties.filters) {
                    properties.filters.map((fil, i) => {
                        if (fil.name === queFil) {
                            object.push(fil.fn());
                        }
                    });
                }
            });
        } else {
            if (properties.filters) {
                properties.filters.map((fil, i) => {
                    if (fil.name === queries.filter) {
                        object.push(fil.fn());
                    }
                });
            }
        }


        if (filter) { object.push(filter.fn()); }
    }
}

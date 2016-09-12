import Models from '../migrations/index';
//import { errorFormater } from '../helpers/error';
import { searchQueryCreator, orderRel } from '../helpers/queryBuilder';
import { sync } from '../migrations/migration';
import * as table from '../models/index';
import { cache, invalidateCache } from '../helpers/cache';
import db from './../migrations/index';


//Generic controller for list 

export function list(req, res, next) {
    //get the route name to use it as model
    const modelName = req.route.name,
        //search the table which hold all models blueprints for the requested name
        tableName = table[modelName],
        //check if order and orderType has passed as query and send them to orderRel function to check if the order is relation based
        order = (req.query.order && req.query.orderType) ? orderRel(req.query.order, req.query.orderType, tableName) : null,
        //send all req.query to searchQueryCreator function to build it
        searchQueries = searchQueryCreator(req.query, tableName),
        //chec if paranoid is in the req.query 
        paranoid = (req.query.paranoid) ? false : true,
        //assign the custom attributes by the result of searchQueryCreator
        attributes = (searchQueries && searchQueries.attributes[0]) ? { attributes: searchQueries.attributes } :
        (req.query.exclude) ? { attributes: { exclude: req.query.exclude.split(',') } } : {};

    //check if the requested data is in our cache    
    cache.get(`${modelName}_${JSON.stringify(req.query)}`, function(error, model) {
        if (error) {
            return res.status(500).send({ error }); }

        if (model) {
            res.json(model);
        } else {
            //else call the db and set it to cache
            Models[modelName].findAndCountAll(Object.assign({}, attributes, {
                distinct: (searchQueries && searchQueries.relation) ? true : false,
                where: (searchQueries && searchQueries.search) ? searchQueries.search : null,
                offset: (req.query.page - 1) * req.query.limit,
                limit: req.query.limit,
                order: order,
                include: (searchQueries && searchQueries.relation) ? searchQueries.relation : null,
                paranoid: paranoid
            })).then((mdl) => {
                cache.set(`${modelName}_${JSON.stringify(req.query)}`, mdl);
                res.json(mdl);
            }).catch((err) => {
                console.log(err);
                return res.status(500).send({ error: err });
            });
        }
    });
}

//Generic controller for get 

export function get(req, res, next) {
    const modelName = req.route.name,
        id = req.params.id,
        tableName = table[modelName],
        searchQueries = searchQueryCreator(req.query, tableName),
        paranoid = (req.query.paranoid) ? false : true,
        attributes = (searchQueries && searchQueries.attributes[0]) ? { attributes: searchQueries.attributes } :
        (req.query.exclude) ? { attributes: { exclude: req.query.exclude.split(',') } } : {};

    cache.get(`${modelName}_${id}_${JSON.stringify(req.query)}`, function(error, model) {
        if (error) {
            return res.status(500).send({ error }); }

        if (model) {
            res.json(model);
        } else {
            Models[modelName].find(Object.assign({}, attributes, {
                where: { id: id },
                include: (searchQueries && searchQueries.relation) ? searchQueries.relation : null,
                paranoid: paranoid
            })).then((mdl) => {
                if (!mdl) {
                    return res.status(422).send({ error: 'Doesnt Exist' });
                }
                cache.set(`${modelName}_${id}_${JSON.stringify(req.query)}`, mdl);
                res.json(mdl);
            }).catch((err) => {
                console.log(err);
                return res.status(500).send({ error: err });
            });

        }
    });
}

//Generic controller for save 

export function save(req, res, next) {
    const modelName = req.route.name,
        data = req.body,
        currentModel = table[modelName],
        //check if a many to one or many to many relation exist
        hasManyTo = (currentModel.definedRelations) ?
        currentModel.definedRelations.filter((x) => x.type === 'belongsToMany' || x.type === 'hasMany') : null;      


    Models[modelName].create(data).then((mdl) => {
        invalidateCache(modelName, true);
        if (hasManyTo && hasManyTo[0]) {
            hasManyTo.map((rel, i) => {
                let definedAssoc = [];
                if (data[rel.name]) {
                    data[rel.name].map((type, k) => {
                        definedAssoc.push(type.id);
                    });
                    Models[rel.name].findAll({ where: { id: { $in: definedAssoc } } }).then((resp) => {
                        mdl[`set${rel.name.capitalizeFirstLetter()}`](resp);
                    });
                }
            });
        }

        res.status(201).send(mdl);
    }).catch((err) => {
        return res.status(500).send({ error: err });
    });
}

//Generic controller for update

export function update(req, res, next) {
    const modelName = req.route.name,
        data = req.body,
        currentModel = table[modelName],
        paranoid = (req.query.paranoid) ? false : true,
        hasManyTo = (currentModel.definedRelations) ?
        currentModel.definedRelations.filter((x) => x.type === 'belongsToMany' || x.type === 'hasMany') : null;

    Models[modelName].find({
        where: { id: req.params.id },
        paranoid: paranoid
    }).then((mdl) => {

        if (!mdl) {
            return res.status(422).send({ error: 'User Not Found' });
        }


        mdl.update(data).then(() => {
            invalidateCache(modelName, true);
            if (hasManyTo && hasManyTo[0]) {
                hasManyTo.map((rel, i) => {
                    let definedAssoc = [];
                    if (data[rel.name]) {
                        data[rel.name].map((type, k) => {
                            definedAssoc.push(type.id);
                        });
                        Models[rel.name].findAll({ where: { id: { $in: definedAssoc } } }).then((resp) => {
                            mdl[`set${rel.name.capitalizeFirstLetter()}`](resp);
                        });
                    }
                });
            }
            res.status(200).send(mdl);
        }).catch((err) => {
            return res.status(500).send({ error: err });
        });
    }).catch((err) => {
        return res.status(500).send({ error: err });
    });
}

//Generic controller for delete 

export function Delete(req, res, next) {
    const modelName = req.route.name;
    invalidateCache(modelName, true);
    Models[modelName].destroy({ where: { id: req.params.id } }).then(() => {
        return res.status(204).send();
    }).catch((err) => {
        return res.status(500).send({ error: err });
    });
}

//Generic controller for restore

export function restore(req, res, next) {
    req.query.id = (req.query.customId) ? req.query.customId : (req.query.id) ? req.query.id : null;
    const modelName = req.route.name,
        tableName = table[modelName],
        searchQueries = searchQueryCreator(req.query, tableName);

    if (!req.query.email && !req.query.id) {
        return res.status(422).send({ error: 'Please provide some parameters' });
    }


    invalidateCache(modelName, true);
    Models[modelName].findOne({
        where: (searchQueries && searchQueries.search) ? searchQueries.search : null,
        paranoid: false
    }).then((mdl) => {
        mdl.restore();
        return res.status(201).send();
    }).catch((err) => {
        return res.status(500).send({ error: err });
    });
}

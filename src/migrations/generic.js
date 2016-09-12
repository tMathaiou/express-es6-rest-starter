import * as table from '../models/index';

export default function(sequelize, DataTypes) {
    let model = [],
        relations,
        tempModel,
        currentModel;


    for (let [i, data] of Object.entries(table)) {
        model.push(sequelize.define(data.name, data.model, data.options));
    }

    for (let [i, data] of Object.entries(table)) {
        if (data.relations) {
            data.definedRelations.map((rel, k) => {
                tempModel = model.find((x) => x.name === rel.name);
                currentModel = model.find((x) => x.name === i);               
                currentModel[rel.type](tempModel, { foreignKey: rel.foreignKey, as: rel.as, through: rel.through });
            });
        }
    }

    return model;
}

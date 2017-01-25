import Sequelize from "sequelize";
import { baseModel } from '../helpers/baseModel';
import bcrypt from 'bcrypt-nodejs';
import passport from 'passport';
import { save } from '../controllers/tenants';
import * as middlewares from '../middlewares/index';


const auth = passport.authenticate('jwt', { session: false });


const defaultOptions = {
    freezeTableName: true,
    paranoid: true,
    instanceMethods: {
        toJSON: function() {
            let values = this.get();

            delete values.password;
            return values;
        }        
    },   
};

export const tenants = {
    name: 'tenants',
    middlewares: {
        general: [],
        save:[]
    },
    model: Object.assign({}, baseModel, {
        name: {type: Sequelize.STRING, allowNull: false},
        hostname: { type: Sequelize.STRING, unique: true, allowNull: false },
        datasource: { type: Sequelize.STRING, allowNull: false },
        subscription: { type: Sequelize.ENUM('month', 'year'), allowNull:false },
        subscriptionDate: { type: Sequelize.DATE, allowNull:false },
        colorScheme: { type: Sequelize.STRING },
        active: { type: Sequelize.BOOLEAN, allowNull:false, defaultValue:true }
    }),
    options: defaultOptions,
    relations: false,
    definedRelations: [],
    controllerGeneric: true,
    filters: [],
    override: {
        save: save
    }
}

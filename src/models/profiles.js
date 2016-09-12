import Sequelize from "sequelize";
import { baseModel } from '../helpers/baseModel';
import passport from 'passport';
import * as middlewares from '../middlewares/index';


const auth = passport.authenticate('jwt', { session: false });


const defaultOptions = {
    freezeTableName: true,
    paranoid: true,   
};

export const profiles = {
    name: 'profiles',
    middlewares: {
        general: [auth, middlewares.expired()],
    },
    model: Object.assign({}, baseModel, {
        name: { type: Sequelize.STRING, allowNull: false },
        email: {
            type: Sequelize.STRING,
            unique: true,
            allowNull: false,
            validate: { isEmail: { msg: "email is not valid" } },
            set: function(val) {
                this.setDataValue('email', val.toLowerCase());
            }
        }
    }),
    options: defaultOptions,
    relations: true,
    definedRelations: [{ name: 'users', type: 'belongsTo', foreignKey: 'user_id', as: 'user' }],
    controllerGeneric: true,
    filters: [],
    override: {}
}

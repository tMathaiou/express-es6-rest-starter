import Sequelize from "sequelize";
import { baseModel } from '../helpers/baseModel';
import bcrypt from 'bcrypt-nodejs';
import passport from 'passport';
import { update } from '../controllers/users';
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
        },
        verifyPassword: function(password, done) {
            return bcrypt.compare(password, this.password, (err, isMatch) => {
                return done(err, isMatch);
            });
        },
    },
    hooks: {
        beforeUpdate: function(user, options, next) {
            bcrypt.genSalt(10, function(err, salt) {
                if (err) {
                    return next(err);
                }

                bcrypt.hash(user.password, salt, null, (err, hash) => {
                    if (err) {
                        return next(err);
                    }

                    user.password = hash;
                    next();
                });
            });
        },
        beforeCreate: function(user, options, next) {
            bcrypt.genSalt(10, function(err, salt) {
                if (err) {
                    return next(err);
                }

                bcrypt.hash(user.password, salt, null, (err, hash) => {
                    if (err) {
                        return next(err);
                    }

                    user.password = hash;
                    next();
                });
            });
        }
    }
};

export const users = {
    name: 'users',
    middlewares: {
        general: [auth, middlewares.expired()],
        save:[]
    },
    model: Object.assign({}, baseModel, {
        username: { type: Sequelize.STRING, unique: true, allowNull: false },
        password: { type: Sequelize.STRING, allowNull: false },
        role: { type: Sequelize.STRING }
    }),
    options: defaultOptions,
    relations: false,
    definedRelations: [],
    controllerGeneric: true,
    filters: [],
    override: {
        update: update
    }
}

import fs from "fs";
import path from "path";
import Sequelize from "sequelize";
import dotenv from 'dotenv';

if (fs.existsSync('.env')) { dotenv.load(); };
const env = process.env.NODE_ENV || "development";

const options = {

    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    //logging: false, 

    pool: {
        max: process.env.POOL_MAX,
        min: process.env.POOL_MIN,
        idle: process.env.POOL_IDLE
    },
};

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, options);

const db = {};

fs
    .readdirSync(__dirname)
    .filter((file) => {
        return (file.indexOf(".") !== 0) && (file !== "index.js") && (file !== "migration.js");
    })
    .forEach((file) => {
        let model = sequelize.import(path.join(__dirname, file));
        if (Array.isArray(model)) {
            model.map((mdl, i) => {
                db[mdl.name] = mdl;
            });
        } else {
            db[model.name] = model;
        }
    });

Object.keys(db).forEach((modelName) => {
    if ("associate" in db[modelName]) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

sequelize.sync();

export default db;

import Models from '../migrations/index';
import { invalidateCache } from '../helpers/cache';
import mysql from 'mysql';
import request from 'request';

export function save(req, res, next) {

    const data = req.body;


    const con = mysql.createConnection({
        host: "localhost",
        user: process.env.DB_USER,
        password: process.env.DB_PASS
    });

    con.connect((err) => {
        if (err) {
            console.log('Error connecting to Db');
            return;
        }
        console.log('Connection established');
    });

    con.query(`CREATE DATABASE ${data.datasource}`, function(err) {
        // if (err) {
        //     return res.status(500).send({ error: err }); 
        // };

        Models.tenants.create(data).then((mdl) => {
            invalidateCache('tenants', true);            
            request('http://localhost:3092/api/setDb/' + data.hostname, function(error, response, body) {
                res.status(201).send(mdl);
            });
        }).catch((err) => {
            return res.status(500).send({ error: err });
        });

    });

}

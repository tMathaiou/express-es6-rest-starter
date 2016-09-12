import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import router from '../router';
import cors from 'cors';
import paginate from 'express-paginate';
import '../prototypes/index.js';
import cookieParser from 'cookie-parser'
import passport from 'passport';
import compression from 'compression';
import cluster from 'cluster';
import os from 'os';
import { resetCache } from '../helpers/cache';
import namedRoutes from 'named-routes';

if (cluster.isMaster) {
    const numWorkers = process.env.WORKERS || os.cpus().length;
    console.log('Master cluster setting up ' + numWorkers + ' workers...');

    for (let i = 0; i < numWorkers; i++) {
        cluster.fork();
    }

    cluster.on('online', (worker) => {
        console.log('Worker ' + worker.process.pid + ' is online');
    });

    cluster.on('exit', (worker, code, signal) => {
        console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
        console.log('Starting a new worker');
        cluster.fork();
    });
} else {
    const app = express();
    const _router = new namedRoutes();
    _router.extendExpress(app);
    app.use(morgan('dev'));
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(cors());
    app.use(paginate.middleware(10, 50));
    router(app);    
    resetCache();
    const port = process.env.PORT || 3091;
    const server = http.createServer(app);
    server.listen(port);
    console.log('Server listening on:', port);
}

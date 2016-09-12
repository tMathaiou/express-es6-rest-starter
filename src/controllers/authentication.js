import jwt from 'jwt-simple';
import config from '../config';

export function tokenForUser(user) {
    const timestamp = new Date().getTime();
    return jwt.encode({ sub: user.id, iat: timestamp, expiresIn: config.expiresIn, ttl: config.ttl }, config.secret);
}

export function signin(req, res, next) {
    res.send({ token: tokenForUser(req.user), user:req.user });
}

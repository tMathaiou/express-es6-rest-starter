import jwt from 'jwt-simple';
import config from '../config';
import { tokenForUser } from '../controllers/authentication'

export function expired() {
    return (req, res, next) => {

        const decodedToken = jwt.decode(req.headers.authorization, config.secret);
        let iat = new Date(decodedToken.iat).getTime(),
            expr = new Date(iat).setMinutes(new Date(iat).getMinutes() + decodedToken.expiresIn),
            refr = new Date(iat).setMinutes(new Date(iat).getMinutes() + decodedToken.ttl),
            now = new Date().getTime();


        if (now > expr) {
            if (now < refr) {
                res.setHeader('refreshToken', tokenForUser(req.user));
                return res.status(401).send({ error: 'Token Expired' });
            } else {
                return res.status(401).send({ error: 'Token Expired' });
            }
        }

        return next();

    };
};

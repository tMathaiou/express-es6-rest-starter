import passport from 'passport';
import Models from '../migrations/index';
import config from '../config';
import { Strategy } from 'passport-jwt';
import { ExtractJwt } from 'passport-jwt';
import LocalStrategy from 'passport-local';

//const localOptions = { usernameField: 'email' };
const localLogin = new LocalStrategy((username, password, done) => {
    if (!username || !password) {
        return done(null, false);
    };


    Models.users.findOne({ where: { username } }).then((user) => {

        if (!user) {
            return done(null, false);
        }

        user.verifyPassword(password, (err, isMatch) => {
            if (err) {
                return done(err);
            }

            if (!isMatch) {
                return done(null, false);
            }
            return done(null, user);
        });
    });
});


const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromHeader('authorization'),
    secretOrKey: config.secret
};

const jwtLogin = new Strategy(jwtOptions, (payLoad, done) => {
    Models.users.findById(payLoad.sub).then((user) => {
        if (user) {
            done(null, user);
        } else {
            done(null, false);
        }
    });
});

passport.use(jwtLogin);
passport.use(localLogin);

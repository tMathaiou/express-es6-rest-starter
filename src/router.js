import { signin } from './controllers/authentication';
import passport from 'passport';
import passportService from './services/passport';
import genericRoutes from './helpers/routesConstructor';
import * as middlewares from './middlewares/index';

const requireSignin = passport.authenticate('local', { session: false });
const auth = passport.authenticate('jwt', { session: false });

export default function(app) {

    app.post(`/api/auth`, requireSignin, signin);

    genericRoutes(app);
}

import { signin } from './controllers/authentication';
import { authorizeTenant } from './controllers/authorizeTenant';
import passport from 'passport';
import passportService from './services/passport';
import genericRoutes from './helpers/routesConstructor';
import * as middlewares from './middlewares/index';

const requireSignin = passport.authenticate('local', { session: false });
const auth = passport.authenticate('jwt', { session: false });

export default function(app) {

    app.post(`/api/auth`, requireSignin, signin);
    app.get(`/api/authorize-tenant/:hostname`, authorizeTenant);

    genericRoutes(app);
}

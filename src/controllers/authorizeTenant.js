import Models from '../migrations/index';


export function authorizeTenant(req, res, next) {


    Models.tenants.find({ where: { hostname: req.params.hostname } }).then((mdl) => {       
        if (mdl) {
            return res.json(mdl);
        }

        return res.status(422).send('Tenant not found');


    }).catch((err) => {
        return res.status(500).send({ error: err });
    });


}

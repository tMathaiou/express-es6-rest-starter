export function roles(roles) {
    return (req, res, next) => {
        roles.map((role, i) => {
            if (req.user && req.user.role === role) {
                return next();                
            }
        })

        res.status(403).send({ error: 'Unauthorized' });
    };
};

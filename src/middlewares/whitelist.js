export function whitelist() {
    return (req, res, next) => {

        const list = ['localhost:9007'];
        console.log(req.get('Origin').replace('http://', ''));

        return list.map((ls) => {
            if (req.get('Origin').replace('http://', '') === ls) {
                return next();
            }
        });

        return res.status(401).send({ error: 'Forbidden' });
    };
};

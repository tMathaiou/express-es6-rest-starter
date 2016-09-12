import Models from '../migrations/index';
import { invalidateCache } from '../helpers/cache';

export function update(req, res, next) {

    const data = req.body;

    Models.users.findById(req.params.id).then((user) => {
        if (!user) {
            return res.status(422).send({ error: 'User Not Found' });
        }


        if (data.password && req.user.id === user.id) {
            if (data.oldPassword) {
                req.user.verifyPassword(data.oldPassword, (err, isMatch) => {
                    if (err) {
                        return next(err); }
                    if (!isMatch) {
                        return res.status(422).send({ error: 'The Passwords doesnt match' });
                    }
                })
            } else {
                return res.status(422).send({ error: 'Old password is required' });
            }
        } else if (data.password && req.user.id !== user.id) {
        	return res.status(401).send({ error: 'You are not authorized to change the password' });
            delete data.password;
        }

        user.update(data).then((user) => {
            res.status(200).send(user);
        }).catch((err) => {
            return res.status(500).send({ error: err.message });
        });
    });
}

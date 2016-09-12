import * as table from '../models/index';
import * as Generic from '../controllers/generic';

export default function(app) {
    for (let [i, data] of Object.entries(table)) {
        if (data.controllerGeneric) {
            const middList = (data.middlewares.list) ? data.middlewares.list : data.middlewares.general,
                middGet = (data.middlewares.get) ? data.middlewares.get : data.middlewares.general,
                middUpd = (data.middlewares.update) ? data.middlewares.update : data.middlewares.general,
                middSave = (data.middlewares.save) ? data.middlewares.save : data.middlewares.general,
                middDel = (data.middlewares.delete) ? data.middlewares.delete : data.middlewares.general,
                middRest = (data.middlewares.restore) ? data.middlewares.restore : data.middlewares.general,
                list = (data.override && data.override.list) ? (data.override.list !== true) ? data.override.list : null : Generic.list,
                get = (data.override && data.override.get) ? (data.override.get !== true) ? data.override.get : null : Generic.get,
                update = (data.override && data.override.update) ? (data.override.update !== true) ? data.override.update : null : Generic.update,
                save = (data.override && data.override.save) ? (data.override.save !== true) ? data.override.save : null : Generic.save,
                del = (data.override && data.override.delete) ? (data.override.delete !== true) ? data.override.delete : null : Generic.Delete,
                rest = (data.override && data.override.restore) ? (data.override.restore !== true) ? data.override.restore : null : Generic.restore;


            if (list) {
                app.get(`/api/${data.name}`, data.name, middList, list);
            }

            if (rest && data.options.paranoid) {
                app.get(`/api/${data.name}/restore`, data.name, middRest, rest);
            }
            if (get) {
                app.get(`/api/${data.name}/:id`, data.name, middGet, get);
            }
            if (update) {
                app.put(`/api/${data.name}/:id`, data.name, middUpd, update);
            }
            if (save) {
                app.post(`/api/${data.name}`, data.name, middSave, save);
            }
            if (del) {
                app.delete(`/api/${data.name}/:id`, data.name, middDel, del);
            }
        }
    }
}

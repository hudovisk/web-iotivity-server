import { Router } from 'express';

import { requireToken } from '../auth/auth-controller';
import * as ResourceController from './resource-controller';

import sockets from '../../index.js';

export default function() {
    var router = Router();

    router.get('/', 
        requireToken,
        (req, res, next) => {
            ResourceController.getResourcesByUserId(req.user._id)
                .then((resources) => {
                    return res.status(200).json({resources});
                }, (reason) =>{
                    console.log(reason);
                    return res.status(500).end();
                });
        }
    );

    router.put('/:resource_id', 
        requireToken,
        (req, res, next) => {
            ResourceController.getResourcesById(req.params.resource_id)
                .then((resource) => {
                    sockets[req.user._id].emit("put", {
                        identifier: resource.identifier,
                        attrs: req.body.attrs
                    });
                    return res.status(200).end();
                }, (reason) =>{
                    console.log(reason);
                    return res.status(500).end();
                });
        }
    );

    return router;
}

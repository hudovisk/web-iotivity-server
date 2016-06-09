import { Router } from 'express';

import { requireToken } from '../auth/auth-controller';
import * as ResourceController from './resource-controller';

export default function() {
    var router = Router();

    router.get('/', 
        requireToken,
        (req, res, next) => {
            
        }
    );

    return router;
}

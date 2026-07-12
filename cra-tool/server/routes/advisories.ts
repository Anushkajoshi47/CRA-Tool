import express from 'express';
const router  = express.Router();
import auth from '../middleware/auth';
import * as ctrl from '../controllers/advisoryController';

router.get('/',      auth, ctrl.list);
router.post('/',     auth, ctrl.create);
router.get('/:id',   auth, ctrl.get);
router.patch('/:id', auth, ctrl.update);

export default router;

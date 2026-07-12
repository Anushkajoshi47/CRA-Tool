import express from 'express';
const router  = express.Router();
import auth from '../middleware/auth';
import * as ctrl from '../controllers/reportController';

router.get('/',       auth, ctrl.listForTicket);  // ?ticketId=<id>
router.post('/',      auth, ctrl.create);
router.patch('/:id',  auth, ctrl.update);
router.delete('/:id', auth, ctrl.remove);

export default router;

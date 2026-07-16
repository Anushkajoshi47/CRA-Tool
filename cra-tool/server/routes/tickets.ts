import express from 'express';
const router  = express.Router();
import auth from '../middleware/auth';
import * as ctrl from '../controllers/ticketController';

router.get('/',                  auth, ctrl.list);
router.post('/',                 auth, ctrl.create);
// static path before '/:id' so "feed" is not parsed as a ticket id
router.get('/feed/activity',     auth, ctrl.getRecentActivity);
router.get('/:id',               auth, ctrl.get);
router.patch('/:id',             auth, ctrl.update);
router.post('/:id/transition',   auth, ctrl.transition);
router.patch('/:id/stage-data',  auth, ctrl.updateStageData);
router.post('/:id/notify-cert',  auth, ctrl.notifyCert);
router.delete('/:id/notify-cert', auth, ctrl.resetCertNotification);
router.delete('/:id',            auth, ctrl.remove);
router.get('/:id/activity',      auth, ctrl.getActivity);
router.post('/:id/comments',     auth, ctrl.addComment);
router.get('/:id/notifications', auth, ctrl.getNotifications);

export default router;

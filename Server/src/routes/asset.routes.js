const router = require('express').Router();
const ctrl   = require('../controllers/asset.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // All routes require login

router.get('/stats',        ctrl.getStats);                                 // All roles
router.get('/',             ctrl.getAll);                                   // All roles
router.get('/:id',          ctrl.getOne);                                   // All roles
router.get('/:id/history',  ctrl.getHistory);                               // All roles

router.post('/',            authorize('Admin', 'Manager'), ctrl.create);    // Admin + Manager
router.put('/:id',          authorize('Admin', 'Manager'), ctrl.update);    // Admin + Manager
router.delete('/:id',       authorize('Admin'),            ctrl.remove);    // Admin only

module.exports = router;

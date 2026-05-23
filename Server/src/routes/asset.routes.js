const router   = require('express').Router();
const ctrl     = require('../controllers/asset.controller');
const { protect, authorize, requirePermission } = require('../middleware/auth');
const validate = require('../middleware/validate');
const v        = require('../validators/asset.validator');

router.use(protect); // All routes require login

router.get('/stats',        requirePermission('consultation'), ctrl.getStats);                       // All roles (Managers need consultation)
router.get('/',             requirePermission('consultation'), ctrl.getAll);                         // All roles (Managers need consultation)
router.get('/:id',          requirePermission('consultation'), ctrl.getOne);                         // All roles
router.get('/:id/history',  requirePermission('consultation'), ctrl.getHistory);                     // All roles

router.post('/',            authorize('Admin', 'Manager'), v.create, validate, ctrl.create);        // Admin + Manager
router.put('/:id',          authorize('Admin', 'Manager'), v.update, validate, ctrl.update);        // Admin + Manager
router.delete('/:id',       authorize('Admin'),            ctrl.remove);                            // Admin only

module.exports = router;

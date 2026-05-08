const router   = require('express').Router();
const ctrl     = require('../controllers/employee.controller');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const v        = require('../validators/employee.validator');

router.use(protect);

router.get('/',           ctrl.getAll);          // All roles
router.get('/:id',        ctrl.getOne);          // All roles
router.get('/:id/assets', ctrl.getAssets);       // All roles

router.post('/',          authorize('Admin'), v.create,     validate, ctrl.create);      // Admin only
router.put('/:id',        authorize('Admin'), v.update,     validate, ctrl.update);      // Admin only
router.delete('/:id',     authorize('Admin'), ctrl.remove);                              // Admin only
router.patch('/:id/role', authorize('Admin'), v.updateRole, validate, ctrl.updateRole);  // Admin only

module.exports = router;

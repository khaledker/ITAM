const router   = require('express').Router();
const ctrl     = require('../controllers/department.controller');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const v        = require('../validators/department.validator');

// Public routes
router.get('/',              ctrl.getAll);         // Public (used for registration form)

router.use(protect);

router.get('/:id',           ctrl.getOne);         // All roles
router.get('/:id/employees', ctrl.getEmployees);   // All roles

router.post('/',   authorize('Admin'), v.create, validate, ctrl.create);  // Admin only
router.put('/:id', authorize('Admin'), v.update, validate, ctrl.update);  // Admin only
router.delete('/:id', authorize('Admin'), ctrl.remove);                   // Admin only

module.exports = router;

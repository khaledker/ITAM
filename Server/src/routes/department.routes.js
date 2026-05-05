const router = require('express').Router();
const ctrl   = require('../controllers/department.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/',                ctrl.getAll);                          // All roles
router.get('/:id',             ctrl.getOne);                          // All roles
router.get('/:id/employees',   ctrl.getEmployees);                    // All roles

router.post('/',               authorize('Admin'), ctrl.create);      // Admin only
router.put('/:id',             authorize('Admin'), ctrl.update);      // Admin only
router.delete('/:id',          authorize('Admin'), ctrl.remove);      // Admin only

module.exports = router;

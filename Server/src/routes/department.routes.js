const router = require('express').Router();
const ctrl   = require('../controllers/department.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/',                ctrl.getAll);
router.get('/:id',             ctrl.getOne);
router.post('/',               ctrl.create);
router.put('/:id',             ctrl.update);
router.delete('/:id',          ctrl.remove);
router.get('/:id/employees',   ctrl.getEmployees);  // Employees in this department

module.exports = router;

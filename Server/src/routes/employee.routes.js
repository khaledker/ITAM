const router = require('express').Router();
const ctrl   = require('../controllers/employee.controller');
const { protect } = require('../middleware/auth');

router.use(protect); // All employee routes require auth

router.get('/',               ctrl.getAll);
router.get('/:id',            ctrl.getOne);
router.post('/',              ctrl.create);
router.put('/:id',            ctrl.update);
router.delete('/:id',         ctrl.remove);
router.get('/:id/assets',     ctrl.getAssets);   // Assets assigned to this employee

module.exports = router;

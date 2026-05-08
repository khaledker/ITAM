const router   = require('express').Router();
const ctrl     = require('../controllers/location.controller');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const v        = require('../validators/location.validator');

router.use(protect);

router.get('/',           ctrl.getAll);      // ?type=Warehouse
router.get('/:id',        ctrl.getOne);
router.get('/:id/assets', ctrl.getAssets);   // Assets currently at this location

router.post('/',   authorize('Admin', 'Manager'), v.create, validate, ctrl.create);
router.put('/:id', authorize('Admin', 'Manager'), v.update, validate, ctrl.update);
router.delete('/:id', authorize('Admin'), ctrl.remove);

module.exports = router;

const router = require('express').Router();
const ctrl   = require('../controllers/location.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/',             ctrl.getAll);    // ?type=Warehouse
router.get('/:id',          ctrl.getOne);
router.post('/',            ctrl.create);
router.put('/:id',          ctrl.update);
router.delete('/:id',       ctrl.remove);
router.get('/:id/assets',   ctrl.getAssets); // Assets currently at this location

module.exports = router;

const router = require('express').Router();
const ctrl   = require('../controllers/asset.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/stats',        ctrl.getStats);          // Summary counts by status
router.get('/',             ctrl.getAll);             // ?status=Available&category=Laptop&location_id=1
router.get('/:id',          ctrl.getOne);
router.post('/',            ctrl.create);
router.put('/:id',          ctrl.update);
router.delete('/:id',       ctrl.remove);
router.get('/:id/history',  ctrl.getHistory);        // Full movement history of this asset

module.exports = router;

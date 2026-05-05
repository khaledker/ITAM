const router = require('express').Router();
const ctrl   = require('../controllers/assetModel.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/',      ctrl.getAll);    // ?category=Laptop&brand=Dell
router.get('/:id',   ctrl.getOne);
router.post('/',     ctrl.create);
router.put('/:id',   ctrl.update);
router.delete('/:id',ctrl.remove);

module.exports = router;

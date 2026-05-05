const router = require('express').Router();
const ctrl   = require('../controllers/movement.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

// List all movements (filterable by ?type=Reception&status=Draft&asset_id=5)
router.get('/',                      ctrl.getAll);
router.get('/:id',                   ctrl.getOne);

// Create movements by type
router.post('/reception',            ctrl.createReception);
router.post('/assignment',           ctrl.createAssignment);
router.post('/transfer',             ctrl.createTransfer);
router.post('/return',               ctrl.createReturn);

// Approve / Reject (also updates Asset.status automatically)
router.patch('/:id/approve',         ctrl.approve);
router.patch('/:id/reject',          ctrl.reject);

module.exports = router;

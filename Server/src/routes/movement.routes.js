const router = require('express').Router();
const ctrl   = require('../controllers/movement.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// All roles can view
router.get('/',                      ctrl.getAll);
router.get('/:id',                   ctrl.getOne);

// All roles can create draft movements
router.post('/reception',            authorize('Admin', 'Manager'), ctrl.createReception);
router.post('/assignment',           authorize('Admin', 'Manager'), ctrl.createAssignment);
router.post('/transfer',             authorize('Admin', 'Manager'), ctrl.createTransfer);
router.post('/return',               ctrl.createReturn);  // All roles can return

// Only Admin + Manager can approve or reject
router.patch('/:id/approve',         authorize('Admin', 'Manager'), ctrl.approve);
router.patch('/:id/reject',          authorize('Admin', 'Manager'), ctrl.reject);

module.exports = router;

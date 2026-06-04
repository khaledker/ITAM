const router   = require('express').Router();
const ctrl     = require('../controllers/registration.controller');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const v        = require('../validators/auth.validator');

// Public self-registration endpoint
router.post('/submit', v.selfRegister, validate, ctrl.submitRequest);

// Protected routes (Admin only)
router.use(protect);
router.use(authorize('Admin'));

router.get('/', ctrl.getAll);
router.get('/pending-count', ctrl.getPendingCount);
router.patch('/:id/approve', ctrl.approve);
router.patch('/:id/reject', ctrl.reject);

module.exports = router;

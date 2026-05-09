const router   = require('express').Router();
const ctrl     = require('../controllers/auth.controller');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const v        = require('../validators/auth.validator');

// Public
router.post('/login', v.login, validate, ctrl.login);

// Admin only — admins create accounts for new employees
router.post('/register', protect, authorize('Admin'), v.register, validate, ctrl.register);

// Any authenticated user
router.get('/me', protect, ctrl.me);

module.exports = router;

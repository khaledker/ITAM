const router   = require('express').Router();
const ctrl     = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const v        = require('../validators/auth.validator');

router.post('/login',    v.login,    validate, ctrl.login);
router.post('/register', v.register, validate, ctrl.register);
router.get('/me',        protect, ctrl.me);

module.exports = router;

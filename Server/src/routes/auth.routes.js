const router = require('express').Router();
const ctrl   = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

router.post('/login',    ctrl.login);
router.post('/register', ctrl.register);
router.get('/me',        protect, ctrl.me);

module.exports = router;

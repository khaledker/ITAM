const router = require('express').Router();
const ctrl   = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/summary', ctrl.getSummary);

module.exports = router;

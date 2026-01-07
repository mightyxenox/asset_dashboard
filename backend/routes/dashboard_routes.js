const router = require('express').Router();
const auth   = require('../middleware');
const { getDashboard } = require('../controller/dashboard_controller');

router.get('/dashboard', auth, getDashboard);

module.exports = router;
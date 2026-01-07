const { getCoinQty } = require('../controller/coin_qty');
const router = require('express').Router();
const auth= require('../middleware');

router.post('/coin_qty', auth, getCoinQty);
module.exports = router;
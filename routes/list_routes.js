const express = require('express');
const router = express.Router();
const { getWallets, getCoins } = require('../controller/list_controller');

router.get('/wallets', getWallets);

router.get('/coins', getCoins);

module.exports = router;

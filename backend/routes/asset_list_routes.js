const express = require('express');
const router = express.Router();
const { getUserCoins, getUserWallets } = require('../controller/asset_list');
const verifyToken = require('../middleware');

router.get('/coins', verifyToken, getUserCoins);
router.get('/wallets', verifyToken, getUserWallets);

module.exports = router;

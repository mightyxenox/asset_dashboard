const express = require('express');
const router = express.Router();

const {getSupportedCurrencies } = require('../controller/supported_currencies');

const { getCoinPrice } = require('../controller/coins_value');

router.get('/price', getCoinPrice);

router.get('/currencies', getSupportedCurrencies);

module.exports = router;

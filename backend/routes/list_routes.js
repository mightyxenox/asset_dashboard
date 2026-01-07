const express = require('express');
const router = express.Router();
const { getWallets, getCoins } = require('../controller/list_controller');

router.get('/allWallets', async (req, res) => {
  try {
    const walletsSet = await getWallets();
    res.json({ wallets: Array.from(walletsSet) });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

router.get('/allCoins', async (req, res) => {
  try {
    const coinsSet = await getCoins();
    res.json({ coins: Array.from(coinsSet) });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

module.exports = router;

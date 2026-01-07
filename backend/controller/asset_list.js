const { WalletAsset } = require('../scylla_db/schema');

const getUserCoins = async (req, res) => {
  const user_id = req.user_id;

  try {
    const assets = await WalletAsset.find({ user_id }, { coin_name: 1 });
    const coinsSet = new Set(assets.map(asset => asset.coin_name));

    res.json({ coins: Array.from(coinsSet) });
  } catch (err) {
    console.error('Error fetching user coins:', err);
    res.status(500).json({ error: 'Failed to fetch user coins' });
  }
};

const getUserWallets = async (req, res) => {
  const user_id = req.user_id;

  try {
    const assets = await WalletAsset.find({ user_id }, { wallet_name: 1 });
    const walletsSet = new Set(assets.map(asset => asset.wallet_name));

    res.json({ wallets: Array.from(walletsSet) });
  } catch (err) {
    console.error('Error fetching user wallets:', err);
    res.status(500).json({ error: 'Failed to fetch user wallets' });
  }
};

module.exports = { getUserCoins, getUserWallets };
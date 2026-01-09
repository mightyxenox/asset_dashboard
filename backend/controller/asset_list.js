const { WalletAsset } = require('../scylla_db/schema');

const getUserCoins = async (req, res) => {
  const user_id = req.user_id;
  
  console.log('=== getUserCoins START ===');
  console.log('Status code before query:', res.statusCode);
  console.log('user_id:', user_id);

  try {
    const assets = await WalletAsset.find({ user_id }, { coin_name: 1 });
    console.log('Found assets:', assets);
    
    const coinsSet = new Set(assets.map(asset => asset.coin_name));
    const coinsArray = Array.from(coinsSet);
    
    console.log('Sending response:', { coins: coinsArray });
    console.log('Status code at response:', res.statusCode);
    
    res.json({ coins: coinsArray });
    console.log('=== getUserCoins END (SUCCESS) ===');
  } catch (err) {
    console.error('=== getUserCoins ERROR ===');
    console.error('Error:', err.message);
    console.error('Error code:', err.code);
    res.status(500).json({ error: 'Failed to fetch user coins' });
  }
};

const getUserWallets = async (req, res) => {
  const user_id = req.user_id;
  
  console.log('=== getUserWallets START ===');
  console.log('user_id:', user_id);

  try {
    const assets = await WalletAsset.find({ user_id }, { wallet_name: 1 });
    console.log('Found assets:', assets);
    
    const walletsSet = new Set(assets.map(asset => asset.wallet_name));
    const walletsArray = Array.from(walletsSet);
    
    console.log('Sending response:', { wallets: walletsArray });
    
    res.json({ wallets: walletsArray });
    console.log('=== getUserWallets END (SUCCESS) ===');
  } catch (err) {
    console.error('=== getUserWallets ERROR ===');
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch user wallets' });
  }
};

module.exports = { getUserCoins, getUserWallets };
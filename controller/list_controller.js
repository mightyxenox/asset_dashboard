const fetch = require('node-fetch');

exports.getWallets = async (req, res) => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/exchanges');
    const data = await response.json();

    const wallets = data.map(exchange => ({
      name: exchange.name
    }));

    res.json({ wallets });
  } catch (error) {
    console.error('Error fetching wallets:', error);
    res.status(500).json({ error: 'Failed to fetch wallets' });
  }
};

exports.getCoins = async (req, res) => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1');
    const data = await response.json();

    const coins = data.map(coin => ({
      name: coin.name
    }));

    res.json({ coins });
  } catch (error) {
    console.error('Error fetching coins:', error);
    res.status(500).json({ error: 'Failed to fetch coins' });
  }
};

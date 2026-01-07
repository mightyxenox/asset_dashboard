const fetch = require('node-fetch');

let cachedCoins = null;
let lastCoinFetch = 0;

exports.getCoins = async () => {
  const now = Date.now();
  const cacheDuration = 60*60*1000;

  if (cachedCoins && now - lastCoinFetch < cacheDuration) {
    return cachedCoins;
  }

  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1'
    );

    if (!response.ok) {
      console.error('Error fetching coins:', response.status);
      return new Set();
    }

    const data = await response.json();
    cachedCoins = new Set(data.map(coin => coin.name));
    lastCoinFetch = now;
    return cachedCoins;
  } catch (error) {
    console.error('Error fetching coins:', error.message || error);
    return new Set();
  }
};

let cachedWallets = null;
let lastWalletFetch = 0;

exports.getWallets = async () => {
  const now = Date.now();
  const cacheDuration = 60 * 60 * 1000;

  if (cachedWallets && now - lastWalletFetch < cacheDuration) {
    return cachedWallets;
  }

  try {
    const response = await fetch('https://api.coingecko.com/api/v3/exchanges');

    if (!response.ok) {
      console.error('Error fetching wallets:', response.status);
      return new Set();
    }

    const data = await response.json();
    cachedWallets = new Set(data.map(exchange => exchange.name));
    lastWalletFetch = now;
    return cachedWallets;
  } catch (error) {
    console.error('Error fetching wallets:', error.message || error);
    return new Set();
  }
};
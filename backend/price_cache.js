
const redis = require('./redis_client');
const fetch = require('node-fetch');

const PRICE_CACHE_KEY = 'coin_prices';
const TTL_SECONDS = 30;

const fetchPrices = async (coinList) => {
  try {
    const priceRes = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?names=${coinList.join(',')}&vs_currencies=usd`
    );

    if (!priceRes.ok) {
      console.error('CoinGecko API Error:', priceRes.status);
      return null;
    }

    const prices = await priceRes.json();
    await redis.setEx(PRICE_CACHE_KEY, TTL_SECONDS, JSON.stringify(prices));

    return prices;
  } catch (error) {
    console.error('Fetch Price Error:', error.message);
    return null;
  }
};

const getPrices = async (coinList) => {
  const cached = await redis.get(PRICE_CACHE_KEY);
  if (cached) {
    return JSON.parse(cached);
  }

  return await fetchPrices(coinList);
};

module.exports = { getPrices };

const fetch = require('node-fetch');

const getCoinPrice = async (req, res) => {
  const { coin, currency } = req.query;

  if (!coin || !currency) {
    return res.status(400).json({ error: 'coin and currency are required in query params' });
  }

  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=${currency}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data[coin]) {
      return res.status(404).json({ error: 'Invalid coin or currency' });
    }

    res.json({ coin, currency, price: data[coin][currency] });
  } catch (error) {
    console.error('Coin price fetch failed:', error);
    res.status(500).json({ error: 'Failed to fetch coin price' });
  }
};
module.exports = { getCoinPrice };
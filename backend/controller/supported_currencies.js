const fetch = require('node-fetch');

const getSupportedCurrencies = async (req, res) => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/supported_vs_currencies');
    if (response.status !== 200) {
      throw new Error('Failed to fetch data');
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error details:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};

module.exports = { getSupportedCurrencies };
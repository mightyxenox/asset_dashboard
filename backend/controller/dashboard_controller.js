const { WalletAsset, CoinAsset } = require('../scylla_db/schema');
const fetch = require('node-fetch');

let cachedPrices = {};
let lastFetchedAt = 0;

exports.getDashboard = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  const user_id = req.user_id;
  const group_by = req.query.group_by || 'coin';
  const coin = req.query.coin || 'all';
  const wallet = req.query.wallet || 'all';
  let mongoQuery = {};
  let Model = null;

  try {
    // Same filtering logic, just different syntax
    switch (true) {
      case (coin !== 'all' && wallet !== 'all'):
        Model = WalletAsset;
        mongoQuery = { user_id, wallet_name: wallet, coin_name: coin };
        break;

      case (group_by === 'coin'):
        switch (true) {
          case (coin !== 'all'):
            Model = CoinAsset;
            mongoQuery = { user_id, coin_name: coin };
            break;

          case (wallet !== 'all'):
            Model = WalletAsset;
            mongoQuery = { user_id, wallet_name: wallet };
            break;

          default:
            Model = CoinAsset;
            mongoQuery = { user_id };
        }
        break;

      case (group_by === 'wallet'):
        switch (true) {
          case (wallet !== 'all'):
            Model = WalletAsset;
            mongoQuery = { user_id, wallet_name: wallet };
            break;

          case (coin !== 'all'):
            Model = CoinAsset;
            mongoQuery = { user_id, coin_name: coin };
            break;

          default:
            Model = WalletAsset;
            mongoQuery = { user_id };
        }
        break;

      default:
        throw new Error('Invalid group_by parameter');
    }

    const result = await Model.find(mongoQuery);

    if (result.length === 0) {
      return res.json({ data: {} });
    }

    const coinSet = new Set();
    result.forEach(row => coinSet.add(row.coin_name));
    const coinList = Array.from(coinSet);
    const now = Date.now();
    if (now - lastFetchedAt > 30000 || Object.keys(cachedPrices).length === 0) {
      try {
        const pricesRes = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?names=${coinList.join(',')}&vs_currencies=usd`
        );
        if (!pricesRes.ok) {
          console.error(`CoinGecko error ${pricesRes.status}: ${await pricesRes.text()}`);
        }
        const pricesJson = await pricesRes.json();

        if (Object.keys(pricesJson).length > 0) {
          cachedPrices = pricesJson;
          lastFetchedAt = now;
        } else {
          console.warn('Empty price data received from CoinGecko');
        }
      } 
      catch (error) {
        console.error('Failed to fetch live prices:', error.message);
      }
    }

    const prices = cachedPrices;

    let overall = {
      total_qty: 0,
      total_invested: 0,
      realised_pnl: 0,
      unrealised_pnl: 0,
    };

    const grouped = {};

    for (const row of result) {
      const { wallet_name, coin_name, qty, total_invested, realised_pnl } = row;

      const live_price = prices[coin_name]?.usd ?? null;
      if (live_price === null) {
        console.warn(`Missing live price for ${coin_name}`);
      }

      const unrealised = live_price !== null
        ? Number(qty * live_price - total_invested)
        : 0;

      overall.total_qty += qty;
      overall.total_invested += total_invested;
      overall.realised_pnl += realised_pnl;
      overall.unrealised_pnl += unrealised;

      const outerKey = group_by === 'coin' ? coin_name : wallet_name;
      const innerKey = group_by === 'coin' ? wallet_name : coin_name;

      if (!grouped[outerKey]) {
        grouped[outerKey] = {
          total_qty: 0,
          total_invested: 0,
          realised_pnl: 0,
          unrealised_pnl: 0,
          [group_by === 'coin' ? 'wallets' : 'coins']: {},
        };
      }

      grouped[outerKey].total_qty += qty;
      grouped[outerKey].total_invested += total_invested;
      grouped[outerKey].realised_pnl += realised_pnl;
      grouped[outerKey].unrealised_pnl += unrealised;

      grouped[outerKey][group_by === 'coin' ? 'wallets' : 'coins'][innerKey] = {
        qty,
        total_invested,
        realised_pnl,
        unrealised_pnl: unrealised,
      };
    }

    return res.json({
      data: {
        overall,
        ...grouped,
      },
    });

  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
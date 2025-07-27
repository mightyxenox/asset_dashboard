const db = require('../scylla_db/db_connect');
const fetch = require('node-fetch');

exports.getDashboard = async (req, res) => {
  const user_id = req.user_id;
  const group_by = req.query.group_by || 'coin';
  const coin = req.query.coin || 'all';
  const wallet = req.query.wallet || 'all';

  let table = '';
  let query = '';
  const filters = [user_id];

  try {
    switch (true) {
      case (coin !== 'all' && wallet !== 'all'):
        table = 'wallet_assets';
        query = `
          SELECT wallet_name, coin_name, qty, total_invested, realised_pnl
          FROM ${table}
          WHERE user_id = ? AND wallet_name = ? AND coin_name = ?
        `;
        filters.push(wallet, coin);
        break;

      case (group_by === 'coin'):
        switch (true) {
          case (coin !== 'all'):
            table = 'coin_assets';
            query = `
              SELECT wallet_name, coin_name, qty, total_invested, realised_pnl
              FROM ${table}
              WHERE user_id = ? AND coin_name = ?
            `;
            filters.push(coin);
            break;

          case (wallet !== 'all'):
            table = 'wallet_assets';
            query = `
              SELECT wallet_name, coin_name, qty, total_invested, realised_pnl
              FROM ${table}
              WHERE user_id = ? AND wallet_name = ?
            `;
            filters.push(wallet);
            break;

          default:
            table = 'coin_assets';
            query = `
              SELECT wallet_name, coin_name, qty, total_invested, realised_pnl
              FROM ${table}
              WHERE user_id = ?
            `;
        }
        break;

      case (group_by === 'wallet'):
        switch (true) {
          case (wallet !== 'all'):
            table = 'wallet_assets';
            query = `
              SELECT wallet_name, coin_name, qty, total_invested, realised_pnl
              FROM ${table}
              WHERE user_id = ? AND wallet_name = ?
            `;
            filters.push(wallet);
            break;

          case (coin !== 'all'):
            table = 'coin_assets';
            query = `
              SELECT wallet_name, coin_name, qty, total_invested, realised_pnl
              FROM ${table}
              WHERE user_id = ? AND coin_name = ?
            `;
            filters.push(coin);
            break;

          default:
            table = 'wallet_assets';
            query = `
              SELECT wallet_name, coin_name, qty, total_invested, realised_pnl
              FROM ${table}
              WHERE user_id = ?
            `;
        }
        break;

      default:
        throw new Error('Invalid group_by parameter');
    }

    const result = await db.execute(query, filters, { prepare: true });

    if (result.rowLength === 0) {
      return res.json({ data: {} });
    }

    const coinSet = new Set();
    result.rows.forEach(row => coinSet.add(row.coin_name));
    const coinList = Array.from(coinSet);

    const pricesRes = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?names=${coinList.join(',')}&vs_currencies=usd`
    );
    const prices = await pricesRes.json();

    let overall = {
      total_qty: 0,
      total_invested: 0,
      realised_pnl: 0,
      unrealised_pnl: 0,
    };

    const grouped = {};

    for (const row of result.rows) {
      const { wallet_name, coin_name, qty, total_invested, realised_pnl } = row;
      const live_price = prices[coin_name]?.usd;
      const unrealised = qty * live_price - total_invested;

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
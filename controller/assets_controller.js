const db = require('../scylla_db/db_connect');
const { getCoins, getWallets } = require('../controller/list_controller');
const MAX_RETRIES = 10;

const updateAsset = async (req, res) => {
  const { wallet_name, coin_name, qty, price_now, action } = req.body;
  const user_id = req.user_id;

  const validCoins = await getCoins();
  const validWallets = await getWallets();

  if (!validCoins.has(coin_name)) {
    return res.status(400).json({ error: 'Invalid coin name provided.' });
  }

  if (!validWallets.has(wallet_name)) {
    return res.status(400).json({ error: 'Invalid wallet name provided.' });
  }

  if (qty <= 0 || price_now <= 0) {
    return res.status(400).json({ error: 'Quantity and price must be greater than zero.' });
  }
  
  if (!wallet_name || !coin_name || !qty || !price_now || !action) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const summaryRes = await db.execute(
      `SELECT realised_pnl FROM user_summary WHERE user_id = ?`,
      [user_id],
      { prepare: true }
    );
    let totalPnl = summaryRes.rowLength ? summaryRes.first().realised_pnl : 0;
    const now = new Date();

    let retries = 0;
    while (retries < MAX_RETRIES) {
      const assetRes = await db.execute(
        `SELECT qty, avg_price, total_invested, realised_pnl FROM wallet_assets
         WHERE user_id = ? AND wallet_name = ? AND coin_name = ?`,
        [user_id, wallet_name, coin_name],
        { prepare: true }
      );

      if (assetRes.rowLength === 0 && action === 'buy') {
        const invested = qty * price_now;
        const insertRes = await db.execute(
          `INSERT INTO wallet_assets (user_id, wallet_name, coin_name, qty, avg_price, total_invested, realised_pnl)
           VALUES (?, ?, ?, ?, ?, ?, ?) IF NOT EXISTS`,
          [user_id, wallet_name, coin_name, qty, price_now, invested, 0],
          { prepare: true }
        );

        if (insertRes.wasApplied()) {
          await db.execute(
            `INSERT INTO coin_assets (user_id, coin_name, wallet_name, qty, avg_price, total_invested, realised_pnl)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user_id, coin_name, wallet_name, qty, price_now, invested, 0],
            { prepare: true }
          );

          await db.execute(
            `INSERT INTO asset_transactions (user_id, wallet_name, coin_name, qty, price, action, timestamp)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user_id, wallet_name, coin_name, qty, price_now, 'buy', now],
            { prepare: true }
          );

          return res.json({ message: 'Buy recorded successfully.', qty, avg_price: price_now });
        } else {
          retries++;
          continue;
        }
      }

      const row = assetRes.first();
      const oldQty = row.qty;
      const oldAvg = row.avg_price;
      const oldInvested = row.total_invested;
      const oldRealisedPnl = row.realised_pnl || 0;

      if (action === 'buy') {
        const newQty = oldQty + qty;
        const newInvested = oldInvested + qty * price_now;
        const newAvg = newInvested / newQty;

        const updateRes = await db.execute(
          `UPDATE wallet_assets SET qty = ?, avg_price = ?, total_invested = ?
           WHERE user_id = ? AND wallet_name = ? AND coin_name = ? IF qty = ?`,
          [newQty, newAvg, newInvested, user_id, wallet_name, coin_name, oldQty],
          { prepare: true }
        );

        if (updateRes.wasApplied()) {
          await db.execute(
            `INSERT INTO coin_assets (user_id, coin_name, wallet_name, qty, avg_price, total_invested, realised_pnl)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user_id, coin_name, wallet_name, newQty, newAvg, newInvested, oldRealisedPnl],
            { prepare: true }
          );

          await db.execute(
            `INSERT INTO asset_transactions (user_id, wallet_name, coin_name, qty, price, action, timestamp)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user_id, wallet_name, coin_name, qty, price_now, 'buy', now],
            { prepare: true }
          );

          return res.json({ message: 'Buy recorded successfully.', qty: newQty, avg_price: newAvg });
        } else {
          retries++;
          continue;
        }

      } else if (action === 'sell') {
        if (qty > oldQty) {
          return res.status(400).json({ error: 'Insufficient coins to sell.' });
        }

        const newQty = oldQty - qty;
        const newInvested = newQty * oldAvg;
        const profit = qty * (price_now - oldAvg);
        const updatedRealisedPnl = oldRealisedPnl + profit;
        const updatedPnlTotal = totalPnl + profit;

        const updateRes = await db.execute(
          `UPDATE wallet_assets SET qty = ?, avg_price = ?, total_invested = ?, realised_pnl = ?
           WHERE user_id = ? AND wallet_name = ? AND coin_name = ? IF qty = ?`,
          [newQty, oldAvg, newInvested, updatedRealisedPnl, user_id, wallet_name, coin_name, oldQty],
          { prepare: true }
        );

        if (updateRes.wasApplied()) {
          await db.execute(
            `INSERT INTO coin_assets (user_id, coin_name, wallet_name, qty, avg_price, total_invested, realised_pnl)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user_id, coin_name, wallet_name, newQty, oldAvg, newInvested, updatedRealisedPnl],
            { prepare: true }
          );

          await db.execute(
            `INSERT INTO user_summary (user_id, realised_pnl)
             VALUES (?, ?)`,
            [user_id, updatedPnlTotal],
            { prepare: true }
          );

          await db.execute(
            `INSERT INTO asset_transactions (user_id, wallet_name, coin_name, qty, price, action, timestamp)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user_id, wallet_name, coin_name, qty, price_now, 'sell', now],
            { prepare: true }
          );

          return res.json({ message: 'Sell recorded successfully.', profit });
        } else {
          retries++;
          continue;
        }
      }

      return res.status(400).json({ error: 'Invalid action type.' });
    }

    return res.status(500).json({ error: 'Could not update asset after multiple retries. Try again later.' });

  } catch (err) {
    console.error('Asset update error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { updateAsset };
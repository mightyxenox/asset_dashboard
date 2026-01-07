const { WalletAsset, CoinAsset, UserSummary, AssetTransaction } = require('../scylla_db/schema');
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
    const summary = await UserSummary.findOne({ user_id });
    let totalPnl = summary ? summary.realised_pnl : 0;
    const now = new Date();

    let retries = 0;
    while (retries < MAX_RETRIES) {
      const asset = await WalletAsset.findOne({ user_id, wallet_name, coin_name });

      if (!asset && action === 'buy') {
        const invested = qty * price_now;
        const newWalletAsset = new WalletAsset({
          user_id,
          wallet_name,
          coin_name,
          qty,
          avg_price: price_now,
          total_invested: invested,
          realised_pnl: 0
        });

        await newWalletAsset.save();

        await CoinAsset.create({
          user_id,
          coin_name,
          wallet_name,
          qty,
          avg_price: price_now,
          total_invested: invested,
          realised_pnl: 0
        });

        await AssetTransaction.create({
          user_id,
          wallet_name,
          coin_name,
          qty,
          price: price_now,
          action: 'BUY',
          timestamp: now
        });

        return res.json({ message: 'Buy recorded successfully.', qty, avg_price: price_now });
      }

      if (!asset) {
        retries++;
        continue;
      }

      const oldQty = asset.qty;
      const oldAvg = asset.avg_price;
      const oldInvested = asset.total_invested;
      const oldRealisedPnl = asset.realised_pnl || 0;

      if (action === 'buy') {
        const newQty = oldQty + qty;
        const newInvested = oldInvested + qty * price_now;
        const newAvg = newInvested / newQty;

        await WalletAsset.updateOne(
          { user_id, wallet_name, coin_name },
          { qty: newQty, avg_price: newAvg, total_invested: newInvested }
        );

        await CoinAsset.findOneAndUpdate(
          { user_id, coin_name, wallet_name },
          { qty: newQty, avg_price: newAvg, total_invested: newInvested, realised_pnl: oldRealisedPnl },
          { upsert: true }
        );

        await AssetTransaction.create({
          user_id,
          wallet_name,
          coin_name,
          qty,
          price: price_now,
          action: 'buy',
          timestamp: now
        });

        return res.json({ message: 'Buy recorded successfully.', qty: newQty, avg_price: newAvg });

      } else if (action === 'sell') {
        if (qty > oldQty) {
          return res.status(400).json({ error: 'Insufficient coins to sell.' });
        }

        const newQty = oldQty - qty;
        const newInvested = newQty * oldAvg;
        const profit = qty * (price_now - oldAvg);
        const updatedRealisedPnl = oldRealisedPnl + profit;
        const updatedPnlTotal = totalPnl + profit;

        await WalletAsset.updateOne(
          { user_id, wallet_name, coin_name },
          { qty: newQty, avg_price: oldAvg, total_invested: newInvested, realised_pnl: updatedRealisedPnl }
        );

        await CoinAsset.findOneAndUpdate(
          { user_id, coin_name, wallet_name },
          { qty: newQty, avg_price: oldAvg, total_invested: newInvested, realised_pnl: updatedRealisedPnl },
          { upsert: true }
        );

        await UserSummary.findOneAndUpdate(
          { user_id },
          { realised_pnl: updatedPnlTotal },
          { upsert: true }
        );

        await AssetTransaction.create({
          user_id,
          wallet_name,
          coin_name,
          qty,
          price: price_now,
          action: 'SELL',
          timestamp: now
        });

        return res.json({ message: 'Sell recorded successfully.', profit });
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
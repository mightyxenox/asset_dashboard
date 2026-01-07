const { WalletAsset } = require('../scylla_db/schema');

exports.getCoinQty = async (req, res) => {
  const { coin_symbol, wallet_name } = req.body;
  const username = req.username;

  if (!coin_symbol || !wallet_name) {
    return res.status(400).json({ error: "coin_symbol and wallet_name are required" });
  }

  try {
    const asset = await WalletAsset.findOne({ 
      user_id: username, 
      coin_name: coin_symbol, 
      wallet_name 
    });

    const qty = asset ? asset.qty : 0;

    return res.json({ qty });
  } catch (err) {
    console.error("Error fetching coin qty:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

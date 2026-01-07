const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  user_id: {
    type: Number,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  full_name: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Wallet Assets Schema
const walletAssetSchema = new mongoose.Schema({
  user_id: {
    type: Number,
    required: true,
    index: true
  },
  wallet_name: {
    type: String,
    required: true
  },
  coin_name: {
    type: String,
    required: true
  },
  qty: {
    type: Number,
    default: 0
  },
  avg_price: {
    type: Number,
    default: 0
  },
  total_invested: {
    type: Number,
    default: 0
  },
  realised_pnl: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Coin Assets Schema
const coinAssetSchema = new mongoose.Schema({
  user_id: {
    type: Number,
    required: true,
    index: true
  },
  coin_name: {
    type: String,
    required: true
  },
  wallet_name: {
    type: String,
    required: true
  },
  qty: {
    type: Number,
    default: 0
  },
  avg_price: {
    type: Number,
    default: 0
  },
  total_invested: {
    type: Number,
    default: 0
  },
  realised_pnl: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// User Summary Schema
const userSummarySchema = new mongoose.Schema({
  user_id: {
    type: Number,
    required: true,
    unique: true
  },
  realised_pnl: {
    type: Number,
    default: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Asset Transactions Schema
const assetTransactionSchema = new mongoose.Schema({
  user_id: {
    type: Number,
    required: true,
    index: true
  },
  wallet_name: {
    type: String,
    required: true
  },
  coin_name: {
    type: String,
    required: true
  },
  qty: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  action: {
    type: String,
    enum: ['BUY', 'SELL'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Create indexes for performance
walletAssetSchema.index({ user_id: 1, wallet_name: 1, coin_name: 1 }, { unique: true });
coinAssetSchema.index({ user_id: 1, coin_name: 1, wallet_name: 1 }, { unique: true });
assetTransactionSchema.index({ user_id: 1, timestamp: -1 });

module.exports = {
  User: mongoose.model('User', userSchema),
  WalletAsset: mongoose.model('WalletAsset', walletAssetSchema),
  CoinAsset: mongoose.model('CoinAsset', coinAssetSchema),
  UserSummary: mongoose.model('UserSummary', userSummarySchema),
  AssetTransaction: mongoose.model('AssetTransaction', assetTransactionSchema)
};
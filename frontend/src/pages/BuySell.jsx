import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '../utils';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { useData } from '../context/DataContext';
import 'react-toastify/dist/ReactToastify.css';

const BuySellPage = () => {
  const navigate = useNavigate();
  const { coins, wallets } = useData();
  const [mode, setMode] = useState('buy');
  const [allCoins, setAllCoins] = useState([]);
  const [allWallets, setAllWallets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    coin_name: '',
    wallet_name: '',
    qty: '',
    price_now: '',
  });

  const [coinSearch, setCoinSearch] = useState('');
  const [walletSearch, setWalletSearch] = useState('');
  const [showCoinDropdown, setShowCoinDropdown] = useState(false);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resCoins, resWallets] = await Promise.all([
          fetchWithAuth('/api/allCoins'),
          fetchWithAuth('/api/allWallets'),
        ]);

        setAllCoins((resCoins.coins || []).map(c => typeof c === 'string' ? c : c.name));
        setAllWallets((resWallets.wallets || []).map(w => typeof w === 'string' ? w : w.name));
      } catch (err) {
        toast.error('Error fetching dropdown data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { coin_name, wallet_name, qty, price_now } = form;

    const parsedQty = parseFloat(qty);
    const parsedPrice = parseFloat(price_now);

    const availableCoins = mode === 'buy' ? allCoins : (coins.map(c => typeof c === 'string' ? c : c.name));
    const availableWallets = mode === 'buy' ? allWallets : (wallets.map(w => typeof w === 'string' ? w : w.name));

    if (!coin_name || !wallet_name || isNaN(parsedQty) || isNaN(parsedPrice) || parsedQty <= 0 || parsedPrice <= 0) {
      toast.error('Please enter valid coin, wallet, quantity, and price');
      return;
    }

    if (!availableCoins.includes(coin_name.trim())) {
      toast.error('Please select a valid coin from the dropdown');
      return;
    }

    if (!availableWallets.includes(wallet_name.trim())) {
      toast.error('Please select a valid wallet from the dropdown');
      return;
    }

    const payload = {
      coin_name: coin_name.trim(),
      wallet_name: wallet_name.trim(),
      qty: parsedQty,
      price_now: parsedPrice,
      action: mode,
    };

    try {
      const res = await fetchWithAuth('/api/asset', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success(`Successfully ${mode === 'buy' ? 'bought' : 'sold'} ${parsedQty} ${coin_name}`);
      setForm({ coin_name: '', wallet_name: '', qty: '', price_now: '' });
      setCoinSearch('');
      setWalletSearch('');
    } catch (err) {
      console.error('Transaction failed:', err);
      toast.error('Transaction failed');
    }
  };

  const availableCoins = mode === 'buy' ? allCoins : (coins.map(c => typeof c === 'string' ? c : c.name));
  const availableWallets = mode === 'buy' ? allWallets : (wallets.map(w => typeof w === 'string' ? w : w.name));

  const filteredCoins = availableCoins.filter((coin) =>
    coin.toLowerCase().includes(coinSearch.toLowerCase())
  );

  const filteredWallets = availableWallets.filter((wallet) =>
    wallet.toLowerCase().includes(walletSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-opacity-60"></div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Toast container */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} theme="colored" />

      {/* Back Button */}
      <div className="flex justify-start mb-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 transition-all duration-200"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Toggle Buy/Sell */}
      <div className="flex justify-center mb-4 space-x-4">
        <button
          onClick={() => setMode('buy')}
          className={`px-4 py-2 rounded ${mode === 'buy' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
        >
          Buy
        </button>
        <button
          onClick={() => setMode('sell')}
          className={`px-4 py-2 rounded ${mode === 'sell' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
        >
          Sell
        </button>
      </div>

      {/* Form (unchanged) */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Coin Dropdown */}
        <div className="relative">
          <label className="block mb-1">Coin</label>
          <input
            type="text"
            placeholder="Search and select coin"
            value={coinSearch}
            onFocus={() => setShowCoinDropdown(true)}
            onChange={(e) => {
              setCoinSearch(e.target.value);
              setShowCoinDropdown(true);
            }}
            className="w-full border rounded px-2 py-1"
          />
          {showCoinDropdown && (
            <div className="absolute z-10 bg-white border rounded shadow w-full max-h-40 overflow-y-auto">
              {filteredCoins.map((coin) => (
                <div
                  key={coin}
                  onClick={() => {
                    setForm((prev) => ({ ...prev, coin_name: coin }));
                    setCoinSearch(coin);
                    setShowCoinDropdown(false);
                  }}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  {coin}
                </div>
              ))}
              {filteredCoins.length === 0 && (
                <div className="px-3 py-2 text-gray-400">No coins found</div>
              )}
            </div>
          )}
        </div>

        {/* Wallet Dropdown */}
        <div className="relative">
          <label className="block mb-1">Wallet</label>
          <input
            type="text"
            placeholder="Search and select wallet"
            value={walletSearch}
            onFocus={() => setShowWalletDropdown(true)}
            onChange={(e) => {
              setWalletSearch(e.target.value);
              setShowWalletDropdown(true);
            }}
            className="w-full border rounded px-2 py-1"
          />
          {showWalletDropdown && (
            <div className="absolute z-10 bg-white border rounded shadow w-full max-h-40 overflow-y-auto">
              {filteredWallets.map((wallet) => (
                <div
                  key={wallet}
                  onClick={() => {
                    setForm((prev) => ({ ...prev, wallet_name: wallet }));
                    setWalletSearch(wallet);
                    setShowWalletDropdown(false);
                  }}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  {wallet}
                </div>
              ))}
              {filteredWallets.length === 0 && (
                <div className="px-3 py-2 text-gray-400">No wallets found</div>
              )}
            </div>
          )}
        </div>

        {/* Quantity */}
        <div>
          <label className="block mb-1">Quantity</label>
          <input
            type="number"
            name="qty"
            value={form.qty}
            onChange={handleChange}
            min="0"
            step="any"
            className="w-full border rounded px-2 py-1"
          />
        </div>

        {/* Price */}
        <div>
          <label className="block mb-1">Price (USD)</label>
          <input
            type="number"
            name="price_now"
            value={form.price_now}
            onChange={handleChange}
            min="0"
            step="any"
            className="w-full border rounded px-2 py-1"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={`w-full py-2 rounded ${mode === 'buy' ? 'bg-green-600' : 'bg-red-600'} text-white`}
        >
          {mode === 'buy' ? 'Buy' : 'Sell'}
        </button>
      </form>
    </div>
  );
};

export default BuySellPage;
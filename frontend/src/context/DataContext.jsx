import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchWithAuth } from '../utils';

const DataContext = createContext();

// Cache configuration
const CACHE_KEY = 'asset_dashboard_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedData = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      if (data.timestamp && Date.now() - data.timestamp < CACHE_DURATION) {
        console.log('DataContext: Using cached data');
        return data;
      }
    }
  } catch (err) {
    console.error('Error reading cache:', err);
  }
  return null;
};

const setCacheData = (wallets, coins) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      wallets,
      coins,
      timestamp: Date.now(),
    }));
    console.log('DataContext: Saved data to cache');
  } catch (err) {
    console.error('Error saving cache:', err);
  }
};

export const DataProvider = ({ children }) => {
  const [wallets, setWallets] = useState([]);
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    // Check cache first
    const cachedData = getCachedData();
    if (cachedData) {
      setWallets(cachedData.wallets || []);
      setCoins(cachedData.coins || []);
      setLoading(false);
      
      // Fetch fresh data in background without blocking UI
      fetchFreshData();
      return;
    }

    // No cache, fetch data
    fetchFreshData();
  }, [token]);

  const fetchFreshData = async () => {
    try {
      setError(null);
      console.log('DataContext: Fetching fresh data from API...');
      
      let walletsResponse;
      try {
        walletsResponse = await fetchWithAuth('/api/wallets');
        console.log('DataContext: Wallets response:', walletsResponse);
      } catch (walletErr) {
        console.error('DataContext: Error fetching wallets:', walletErr);
        walletsResponse = { wallets: [] };
      }
      
      let coinsResponse;
      try {
        coinsResponse = await fetchWithAuth('/api/coins');
        console.log('DataContext: Coins response:', coinsResponse);
      } catch (coinErr) {
        console.error('DataContext: Error fetching coins:', coinErr);
        setError(`Coins fetch failed: ${coinErr.message}`);
        coinsResponse = { coins: [] };
      }
      
      const walletsData = walletsResponse?.wallets || [];
      const coinsData = coinsResponse?.coins || [];
      
      console.log('DataContext: Setting wallets:', walletsData);
      console.log('DataContext: Setting coins:', coinsData);
      
      const walletsArray = Array.isArray(walletsData) ? walletsData : [];
      const coinsArray = Array.isArray(coinsData) ? coinsData : [];
      
      setWallets(walletsArray);
      setCoins(coinsArray);
      
      // Save to cache
      setCacheData(walletsArray, coinsArray);
    } catch (err) {
      console.error('DataContext: Error in fetchFreshData:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DataContext.Provider value={{ wallets, coins, loading, error, refetch: fetchFreshData }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};

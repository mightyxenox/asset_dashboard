import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchWithAuth } from '../utils';

const DataContext = createContext();

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

    const fetchData = async () => {
      try {
        setError(null);
        console.log('DataContext: Fetching wallets and coins...');
        
        // Fetch wallets
        let walletsResponse;
        try {
          walletsResponse = await fetchWithAuth('/api/wallets');
          console.log('DataContext: Wallets response:', walletsResponse);
        } catch (walletErr) {
          console.error('DataContext: Error fetching wallets:', walletErr);
          walletsResponse = { wallets: [] };
        }
        
        // Fetch coins
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
        
        setWallets(Array.isArray(walletsData) ? walletsData : []);
        setCoins(Array.isArray(coinsData) ? coinsData : []);
      } catch (err) {
        console.error('DataContext: Error in fetchData:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  return (
    <DataContext.Provider value={{ wallets, coins, loading, error }}>
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

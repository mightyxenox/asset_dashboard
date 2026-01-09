import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchWithAuth } from '../utils';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [wallets, setWallets] = useState([]);
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const [resWallets, resCoins] = await Promise.all([
          fetchWithAuth('/api/wallets'),
          fetchWithAuth('/api/coins'),
        ]);
        setWallets(resWallets.wallets || []);
        setCoins(resCoins.coins || []);
      } catch (err) {
        console.error('Error fetching wallets and coins:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]); // ONLY token in dependency

  return (
    <DataContext.Provider value={{ wallets, coins, loading }}>
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
